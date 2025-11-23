import os
import tempfile
import shutil
import uuid
from flask import Flask, request, jsonify
from dotenv import load_dotenv
import requests

# load .env if present
load_dotenv()

try:
    from flask_cors import CORS
except Exception:
    CORS = None

app = Flask(__name__)
if CORS:
    CORS(app)


@app.route("/")
def index():
    return (
        "<h1>AI Medical Assistant</h1>"
        "<p>POST a file (image or PDF) to <code>/process</code>. Check health at <code>/healthz</code>.</p>"
    )


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
            img = Image.open(image_path)
            text = pytesseract.image_to_string(img)
            if text and text.strip():
                return text
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
        try:
            with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp_img:
                img.save(tmp_img.name, 'JPEG')
                text = image_to_text(tmp_img.name)
                pages_text.append(text)
                os.unlink(tmp_img.name)
        except Exception as page_e:
            pages_text.append(f"[page error: {page_e}]")
    return "\n\n".join(pages_text)


def extract_entities(text):
    """Extract medical entities using SciSpaCy (free) by default."""
    from collections import defaultdict
    try:
        import spacy
        # Preferred: SciSpacy clinical model
        try:
            nlp = spacy.load("en_ner_bc5cdr_md")
        except Exception as load_err:
            # Model not installed or load failed. Provide clear guidance and fall back.
            print(f"SciSpaCy model load failed: {load_err}")
            fallback_msg = (
                "SciSpaCy model 'en_ner_bc5cdr_md' not found or failed to load.\n"
                "You can install it (example) via pip from the project's GitHub releases:\n"
                "  pip install scispacy\n"
                "  pip install https://github.com/allenai/scispacy/releases/download/v0.5.1/en_ner_bc5cdr_md-0.5.1.tar.gz\n"
                "If the above 404s, the project release asset URL may have changed — as a safe fallback we'll use spaCy's small English model (en_core_web_sm) to extract generic entities.")
            try:
                # Try SciSpacy alternate package name or other local sci models
                nlp = spacy.load("en_core_sci_sm")
            except Exception:
                try:
                    # Last-resort: spaCy small model
                    try:
                        nlp = spacy.load("en_core_web_sm")
                    except Exception:
                        # If en_core_web_sm is not installed, raise informative error
                        raise RuntimeError(
                            fallback_msg
                            + "\nTo install fallback spaCy model: python -m spacy download en_core_web_sm"
                        )
                except Exception as fallback_err:
                    print(f"Entity extraction fallback failed: {fallback_err}")
                    return {"error": str(fallback_err)}

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
    """Summarize text using local transformers summarization pipeline."""
    try:
        from transformers import pipeline
        summarizer = pipeline("summarization")
        if len(text.split()) < 40:
            return text
        
        # Adjust max_length based on input length to avoid errors
        input_len = len(text.split())
        max_len = min(120, input_len)
        min_len = min(30, max_len - 1)
        
        out = summarizer(text, max_length=max_len, min_length=min_len, truncation=True)
        return out[0]["summary_text"]
    except Exception as e:
        return f"Summarization error: {e}"


def translate_text(text, target_lang="ar"):
    """Translate English text to target_lang using MarianMT (free) by default."""
    if target_lang == "en":
        return text
    try:
        from transformers import MarianMTModel, MarianTokenizer
        model_name = f"Helsinki-NLP/opus-mt-en-{target_lang}"
        tokenizer = MarianTokenizer.from_pretrained(model_name)
        model = MarianMTModel.from_pretrained(model_name)
        inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
        translated = model.generate(**inputs)
        return tokenizer.decode(translated[0], skip_special_tokens=True)
    except Exception as e:
        print(f"MarianMT error: {e}")
    # optional Azure fallback if configured
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
            response = requests.post(constructed_url, params=params, headers=headers, json=body)
            response.raise_for_status()
            result = response.json()
            return result[0]['translations'][0]['text']
    except Exception as ae:
        print(f"Azure Translator fallback error: {ae}")

    return f"Translation failed: no available translator for target '{target_lang}'"


@app.route("/process", methods=["POST"])
def process_file():
    if "file" not in request.files:
        return jsonify({"error": "no file provided"}), 400

    f = request.files["file"]
    if f.filename == "":
        return jsonify({"error": "empty filename"}), 400

    tmpdir = tempfile.mkdtemp(prefix="ai_med_")
    try:
        upload_path = os.path.join(tmpdir, f.filename)
        f.save(upload_path)

        name, ext = os.path.splitext(f.filename.lower())
        if ext in [".pdf"]:
            text = pdf_to_text(upload_path)
        else:
            text = image_to_text(upload_path)

        entities = extract_entities(text)
        summary = summarize_text(text)

        target = request.form.get("translate_to", "ar")
        translation = translate_text(summary if isinstance(summary, str) else text, target_lang=target)

        resp = {
            "text": text,
            "entities": entities,
            "summary": summary,
            "translation": translation,
        }

        return jsonify(resp)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        try:
            shutil.rmtree(tmpdir)
        except Exception:
            pass


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
    try:
        import spacy
        checks["spacy_installed"] = True
        try:
            spacy.util.get_package_version("en_ner_bc5cdr_md")
            checks["scispacy_model_present"] = True
        except Exception:
            checks["scispacy_model_present"] = False
    except Exception:
        checks["spacy_installed"] = False
        checks["scispacy_model_present"] = False
    try:
        import transformers
        checks["transformers_installed"] = True
    except Exception:
        checks["transformers_installed"] = False
    return jsonify(checks)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
