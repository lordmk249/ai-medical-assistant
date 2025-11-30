import os
import tempfile
import shutil
import uuid
import threading
from flask import Flask, request, jsonify
from dotenv import load_dotenv
import requests

# Configuration
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'}
REQUEST_TIMEOUT = 30  # seconds for external API calls

# Global AI Models
nlp = None
summarizer = None
translation_models = {}
translation_lock = threading.Lock()

# load .env if present
load_dotenv()

try:
    from flask_cors import CORS
except Exception:
    CORS = None

app = Flask(__name__)
if CORS:
    CORS(app)


def load_models():
    """Load AI models at startup to avoid latency per request."""
    global nlp, summarizer
    print("Loading AI models... This may take a moment.")
    
    # Load SciSpaCy or fallback
    try:
        import spacy
        try:
            nlp = spacy.load("en_ner_bc5cdr_md")
            print("Loaded SciSpaCy model: en_ner_bc5cdr_md")
        except Exception:
            try:
                nlp = spacy.load("en_core_sci_sm")
                print("Loaded SciSpaCy model: en_core_sci_sm")
            except Exception:
                try:
                    nlp = spacy.load("en_core_web_sm")
                    print("Loaded fallback model: en_core_web_sm")
                except Exception as e:
                    print(f"Failed to load any SpaCy model: {e}")
    except Exception as e:
        print(f"SpaCy import failed: {e}")

    # Load Summarizer
    try:
        from transformers import pipeline
        summarizer = pipeline("summarization")
        print("Loaded Summarization pipeline")
    except Exception as e:
        print(f"Failed to load summarization pipeline: {e}")


# Initialize models on startup
load_models()


@app.route("/")
def index():
    return (
        "<h1>AI Medical Assistant</h1>"
        "<p>POST a file (image or PDF) to <code>/process</code>. Check health at <code>/healthz</code>.</p>"
        f"<p>Max file size: {MAX_FILE_SIZE // (1024*1024)}MB. Supported formats: {', '.join(ALLOWED_EXTENSIONS)}</p>"
    )


def validate_file(file):
    """Validate uploaded file for security and size constraints."""
    if not file or file.filename == "":
        return False, "Empty filename"
    
    # Check file extension
    _, ext = os.path.splitext(file.filename.lower())
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"Unsupported file type: {ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
    
    # Check file size if available
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    
    if size > MAX_FILE_SIZE:
        return False, f"File too large. Max size: {MAX_FILE_SIZE // (1024*1024)}MB"
    
    if size == 0:
        return False, "Empty file"
    
    return True, None


def image_to_text(image_path):
    """OCR an image using local Tesseract (preferred) or Google Vision if configured.

    Returns extracted text or raises RuntimeError with actionable instructions.
    """
    # Try local Tesseract first
    try:
        from PIL import Image
        import pytesseract
    except Exception:
        pytesseract = None

    if pytesseract:
        try:
            # ensure binary available
            from shutil import which

            if not which("tesseract"):
                raise RuntimeError(
                    "Tesseract binary not found. Install tesseract (conda-forge or brew) and ensure it's on PATH."
                )
            # check that tessdata (language files) exist
            import sys
            tessdata_prefix = os.getenv("TESSDATA_PREFIX")
            possible_tessdirs = []
            if tessdata_prefix:
                possible_tessdirs.append(os.path.join(tessdata_prefix, "tessdata"))
            possible_tessdirs.append(os.path.join(sys.prefix, "share", "tessdata"))
            possible_tessdirs.append("/usr/local/share/tessdata")
            possible_tessdirs.append("/opt/homebrew/share/tessdata")

            eng_found = False
            for d in possible_tessdirs:
                try:
                    if os.path.exists(os.path.join(d, "eng.traineddata")):
                        eng_found = True
                        # CRITICAL FIX: Set TESSDATA_PREFIX so the binary knows where to look
                        # The prefix must be the PARENT of the tessdata directory
                        tess_prefix = os.path.dirname(d)
                        os.environ["TESSDATA_PREFIX"] = tess_prefix
                        print(f"Found tesseract data in {d}, setting TESSDATA_PREFIX={tess_prefix}")
                        break
                except Exception:
                    continue

            if not eng_found:
                hint = (
                    "Tesseract couldn't load any languages (eng.traineddata missing).\n"
                    "Make sure the tessdata directory contains 'eng.traineddata' and set TESSDATA_PREFIX to the parent directory of 'tessdata'.\n"
                    "Example (zsh): export TESSDATA_PREFIX=\"$(python -c 'import sys,os; print(os.path.join(sys.prefix, \"share\", \"tessdata\"))')\"\n"
                    "Or copy eng.traineddata to a common location: sudo cp eng.traineddata /opt/homebrew/share/tessdata/"
                )
                raise RuntimeError(hint)

            img = Image.open(image_path)
            text = pytesseract.image_to_string(img)
            if text and text.strip():
                return text
        except RuntimeError:
            raise
        except Exception as e:
            # continue to optional fallback
            print(f"pytesseract error: {e}")

    # Optional: Google Vision if ADC is configured
    try:
        if os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or os.getenv("GOOGLE_API_KEY"):
            from google.cloud import vision
            import io

            client = vision.ImageAnnotatorClient()
            with io.open(image_path, 'rb') as image_file:
                content = image_file.read()
            image = vision.Image(content=content)
            response = client.text_detection(image=image)
            if response.error.message:
                raise RuntimeError(response.error.message)
            texts = response.text_annotations
            if texts:
                return texts[0].description
    except Exception as ge:
        print(f"Google Vision error: {ge}")

    # Optional fallback: EasyOCR (pure-python reader, requires torch). Try if installed.
    try:
        import easyocr
        reader = easyocr.Reader(['en'], gpu=False)
        results = reader.readtext(image_path)
        if results:
            # results are (bbox, text, confidence)
            text = "\n".join([r[1] for r in results if r and len(r) > 1])
            if text.strip():
                return text
    except Exception as ee:
        # don't fail here; easyocr may not be installed or may fail without GPU/torch
        print(f"EasyOCR fallback error: {ee}")

    raise RuntimeError(
        "OCR failed: no usable OCR method succeeded.\n"
        "- Install tesseract and the language data (eng). Example: conda install -c conda-forge tesseract\n"
        "- Or configure Google Vision by setting GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON."
    )


def pdf_to_text(pdf_path):
    """Convert PDF to images and OCR each page using pdf2image + Tesseract.

    Falls back to PyPDF2 for text-based PDFs.
    """
    try:
        from pdf2image import convert_from_path, exceptions as pdf2image_exceptions
        import pytesseract
    except Exception as e:
        # try selectable text extraction
        try:
            from PyPDF2 import PdfReader
        except Exception:
            raise RuntimeError(
                f"Missing pdf->image dependencies: {e}. Install 'pdf2image' and poppler for OCR, or install 'PyPDF2' to extract text from text-based PDFs."
            )

        reader = PdfReader(pdf_path)
        pages_text = []
        for page in reader.pages:
            try:
                pages_text.append(page.extract_text() or "")
            except Exception:
                pages_text.append("")
        return "\n\n".join(pages_text)

    # convert and OCR
    try:
        images = convert_from_path(pdf_path)
    except Exception as e:
        # detect missing poppler
        try:
            missing_poppler = False
            if hasattr(pdf2image_exceptions, "PDFInfoNotInstalledError") and isinstance(
                e, pdf2image_exceptions.PDFInfoNotInstalledError
            ):
                missing_poppler = True
            elif hasattr(pdf2image_exceptions, "PDFPageCountError") and isinstance(
                e, pdf2image_exceptions.PDFPageCountError
            ):
                missing_poppler = "Unable to get page count" in str(e)
            else:
                msg = str(e).lower()
                if "unable to get page count" in msg or "pdfinfo" in msg or "pdftoppm" in msg:
                    missing_poppler = True

            if missing_poppler:
                raise RuntimeError(
                    "Poppler not found or 'pdfinfo' is not in PATH.\n"
                    "Install poppler (recommended via conda-forge): conda install -c conda-forge poppler\n"
                    "Or on macOS with Homebrew: brew install poppler\n"
                    "Then ensure the 'pdfinfo' binary is on your PATH and restart the server."
                )
        except RuntimeError:
            raise
        except Exception:
            pass

        raise RuntimeError(
            f"Error converting PDF to images: {e}. Ensure poppler (pdfinfo/pdftoppm) is installed and available in PATH."
        )

    pages_text = []
    for img in images:
        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp_img:
                tmp_path = tmp_img.name
                img.save(tmp_path, 'JPEG')
            text = image_to_text(tmp_path)
            pages_text.append(text)
        except Exception as page_e:
            pages_text.append(f"[page error: {page_e}]")
        finally:
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.unlink(tmp_path)
                except Exception:
                    pass
    return "\n\n".join(pages_text)


def extract_entities(text):
    """Extract medical entities using global SciSpaCy model."""
    from collections import defaultdict
    
    if nlp is None:
        return {"error": "Entity extraction model not loaded."}

    try:
        # Limit text length to avoid processing issues
        max_chars = 100000
        if len(text) > max_chars:
            text = text[:max_chars]
        
        # Run the pipeline and collect entities
        doc = nlp(text)
        grouped = defaultdict(list)
        for ent in getattr(doc, "ents", []):
            label = getattr(ent, "label_", "")
            if label.upper() in ("DISEASE", "CONDITION", "SYMPTOM"):
                grouped['Diseases & Symptoms'].append(ent.text)
            elif label.upper() in ("CHEMICAL", "MEDICATION", "DRUG"):
                grouped['Medications'].append(ent.text)
            else:
                grouped['Other'].append(f"{ent.text} ({label})")

        return {k: list(dict.fromkeys(v)) for k, v in grouped.items()}
    except Exception as e:
        print(f"Entity extraction unexpected error: {e}")
        return {"error": f"entity extraction failed: {e}"}


def summarize_text(text):
    """Summarize text using global transformers summarization pipeline."""
    if summarizer is None:
        return "Summarization model not loaded."

    try:
        if len(text.split()) < 40:
            return text
        
        # Adjust max_length based on input length to avoid errors
        input_len = len(text.split())
        max_len = min(120, input_len)
        min_len = min(30, max_len - 1)
        
        # Limit input length for summarization
        max_input_words = 1000
        if input_len > max_input_words:
            text = " ".join(text.split()[:max_input_words])
        
        out = summarizer(text, max_length=max_len, min_length=min_len, truncation=True)
        return out[0]["summary_text"]
    except Exception as e:
        print(f"Summarization error: {e}")
        return f"Summarization error: {e}"


def translate_text(text, target_lang="ar"):
    """Translate English text to target_lang using MarianMT (free) by default."""
    if target_lang == "en":
        return text
    
    # Validate target language format
    if not target_lang or not target_lang.isalpha() or len(target_lang) > 10:
        return f"Invalid target language code: {target_lang}"
    
    # Limit text length
    max_chars = 5000
    if len(text) > max_chars:
        text = text[:max_chars]
    
    # Check Azure first if configured
    try:
        key = os.getenv('AZURE_TRANSLATOR_KEY')
        endpoint = os.getenv('AZURE_TRANSLATOR_ENDPOINT')
        location = os.getenv('AZURE_TRANSLATOR_REGION')
        if key and endpoint:
            path = '/translate'
            constructed_url = endpoint + path
            params = {'api-version': '3.0', 'from': 'en', 'to': target_lang}
            headers = {
                'Ocp-Apim-Subscription-Key': key,
                'Ocp-Apim-Subscription-Region': location,
                'Content-type': 'application/json',
                'X-ClientTraceId': str(uuid.uuid4())
            }
            body = [{'text': text}]
            response = requests.post(
                constructed_url, 
                params=params, 
                headers=headers, 
                json=body,
                timeout=REQUEST_TIMEOUT
            )
            response.raise_for_status()
            result = response.json()
            return result[0]['translations'][0]['text']
    except requests.exceptions.Timeout:
        print("Azure Translator timeout")
    except Exception as ae:
        print(f"Azure Translator fallback error: {ae}")

    # Fallback to local MarianMT with caching and thread safety
    try:
        from transformers import MarianMTModel, MarianTokenizer
        
        model_name = f"Helsinki-NLP/opus-mt-en-{target_lang}"
        
        with translation_lock:
            if model_name not in translation_models:
                print(f"Loading translation model: {model_name}")
                try:
                    tokenizer = MarianTokenizer.from_pretrained(model_name)
                    model = MarianMTModel.from_pretrained(model_name)
                    translation_models[model_name] = (tokenizer, model)
                except Exception as load_err:
                    return f"Translation model not available for language: {target_lang} ({load_err})"
            
            tokenizer, model = translation_models[model_name]

        inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
        translated = model.generate(**inputs)
        return tokenizer.decode(translated[0], skip_special_tokens=True)
    except Exception as e:
        print(f"MarianMT error: {e}")
        return f"Translation failed: {e}"


@app.route("/process", methods=["POST"])
def process_file():
    if "file" not in request.files:
        return jsonify({"error": "no file provided"}), 400

    f = request.files["file"]
    
    # Validate file
    is_valid, error_msg = validate_file(f)
    if not is_valid:
        return jsonify({"error": error_msg}), 400

    tmpdir = tempfile.mkdtemp(prefix="ai_med_")
    try:
        # Sanitize filename to prevent path traversal
        safe_filename = os.path.basename(f.filename)
        upload_path = os.path.join(tmpdir, safe_filename)
        f.save(upload_path)

        name, ext = os.path.splitext(safe_filename.lower())
        if ext in [".pdf"]:
            text = pdf_to_text(upload_path)
        else:
            text = image_to_text(upload_path)

        if not text or not text.strip():
            return jsonify({"error": "No text could be extracted from the file"}), 400

        entities = extract_entities(text)
        
        # Check if entity extraction failed
        if isinstance(entities, dict) and "error" in entities:
            entities = {"warning": entities["error"]}
        
        summary = summarize_text(text)

        target = request.form.get("translate_to", "ar")
        translation = translate_text(summary if isinstance(summary, str) else text, target_lang=target)

        resp = {
            "text": text[:10000],  # Limit response size
            "text_length": len(text),
            "entities": entities,
            "summary": summary,
            "translation": translation,
        }

        return jsonify(resp)
    except Exception as e:
        # Treat OCR/system dependency failures as client-side configuration issues (400)
        msg = str(e)
        ocr_indicators = ["OCR failed", "Tesseract", "poppler", "pdfinfo", "pdf2image", "google", "traineddata"]
        if any(indicator.lower() in msg.lower() for indicator in ocr_indicators):
            return jsonify({"error": msg}), 400
        
        print(f"Unexpected error in process_file: {e}")
        return jsonify({"error": f"Processing failed: {msg}"}), 500
    finally:
        try:
            shutil.rmtree(tmpdir)
        except Exception as cleanup_err:
            print(f"Cleanup error: {cleanup_err}")


@app.route("/analyze", methods=["POST"])  # alias
def analyze_file():
    return process_file()


@app.route("/healthz")
def health():
    checks = {"status": "ok"}
    try:
        from shutil import which
        checks["pdfinfo"] = bool(which("pdfinfo"))
    except Exception:
        checks["pdfinfo"] = False
    try:
        from shutil import which
        checks["tesseract"] = bool(which("tesseract"))
    except Exception:
        checks["tesseract"] = False

    # report tessdata/TESSDATA_PREFIX and whether eng.traineddata exists in common locations
    try:
        tess_prefix = os.getenv("TESSDATA_PREFIX")
        checks["TESSDATA_PREFIX"] = tess_prefix or None
        import sys
        possible = []
        if tess_prefix:
            possible.append(os.path.join(tess_prefix, "tessdata"))
        possible.append(os.path.join(sys.prefix, "share", "tessdata"))
        possible.append("/usr/local/share/tessdata")
        possible.append("/opt/homebrew/share/tessdata")
        checks["tessdata_checked_paths"] = possible
        checks["eng_traineddata_found"] = any(
            os.path.exists(os.path.join(p, "eng.traineddata")) for p in possible
        )
    except Exception as e:
        checks["tessdata_check_error"] = str(e)

    # try listing tesseract languages for more diagnostics
    try:
        import subprocess
        out = subprocess.run(
            ["tesseract", "--list-langs"], 
            capture_output=True, 
            text=True, 
            timeout=5
        )
        if out.returncode == 0:
            # output includes header lines; parse into lines
            lines = [l.strip() for l in out.stdout.splitlines() if l.strip()]
            checks["tesseract_langs"] = lines
        else:
            checks["tesseract_list_error"] = out.stderr.strip() or out.stdout.strip()
    except Exception as e:
        checks["tesseract_list_error"] = str(e)

    checks["spacy_loaded"] = nlp is not None
    checks["summarizer_loaded"] = summarizer is not None
    checks["max_file_size_mb"] = MAX_FILE_SIZE // (1024 * 1024)
    checks["allowed_extensions"] = list(ALLOWED_EXTENSIONS)

    return jsonify(checks)


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    
    if debug:
        print("WARNING: Running in debug mode. This should NOT be used in production!")
    
    app.run(host="0.0.0.0", port=port, debug=debug)