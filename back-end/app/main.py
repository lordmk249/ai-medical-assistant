import os
import tempfile
import shutil
import uuid
import sys
from pathlib import Path
import cv2
import numpy as np

# Paths for reorganized structure
BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_TESSDATA = BASE_DIR / "app" / "tessdata"

# Dynamic lookup for OCR tools (poppler, tesseract)
TESSERACT_PATH = shutil.which("tesseract")
PDFTOPPM_PATH = shutil.which("pdftoppm")

# Set TESSDATA_PREFIX globally so Tesseract knows where to look for languages
# Try common locations if not set in environment
if not os.environ.get("TESSDATA_PREFIX"):
    possible_tessdata = [
        str(PROJECT_TESSDATA),
        "/usr/local/share/tessdata",
        "/usr/share/tesseract-ocr/tessdata",
        "/usr/share/tessdata",
        "/opt/homebrew/share/tessdata",
    ]
    if TESSERACT_PATH:
        # Infer from tesseract path (e.g., /usr/local/bin/tesseract -> /usr/local/share/tessdata)
        base_share = os.path.join(os.path.dirname(os.path.dirname(TESSERACT_PATH)), "share", "tessdata")
        possible_tessdata.insert(0, base_share)

    for p in possible_tessdata:
        if os.path.exists(os.path.join(p, "eng.traineddata")):
            os.environ["TESSDATA_PREFIX"] = p
            break

try:
    import pytesseract
    if TESSERACT_PATH:
        pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH
except Exception:
    pass

import threading
from flask import Flask, request, jsonify
from dotenv import load_dotenv
import requests
import time

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

import google.genai as genai
client = None
if os.getenv("GEMINI_API_KEY"):
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    print("Gemini API configured.")
else:
    print("WARNING: GEMINI_API_KEY not found in environment.")

from flask_cors import CORS
from sqlalchemy.exc import OperationalError, SQLAlchemyError

app = Flask(__name__)
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
        # Ensure a supported deep-learning backend is available before loading the pipeline
        backend = None
        try:
            import torch  # noqa: F401
            backend = "pt"
        except Exception:
            try:
                import tensorflow as tf  # noqa: F401
                backend = "tf"
            except Exception:
                backend = None

        if backend is None:
            summarizer = None
            print("Summarization pipeline skipped: no backend (torch/tensorflow/flax) installed.")
            print("Install 'torch' or 'tensorflow' in the backend virtualenv to enable summarization.")
        else:
            # specify a stable summarization model explicitly to avoid default-model warnings
            summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6", framework=("pt" if backend == "pt" else "tf"))
            print(f"Loaded Summarization pipeline with backend={backend}")
    except Exception as e:
        print(f"Failed to load summarization pipeline: {e}")
        summarizer = None


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

            # Preprocess image for better OCR
            img_cv = cv2.imread(image_path)
            if img_cv is not None:
                # Convert to grayscale
                gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
                # Denoise
                denoised = cv2.fastNlMeansDenoising(gray, h=10)
                # Adaptive thresholding
                thresh = cv2.adaptiveThreshold(denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
                
                # Save preprocessed image back to tmp for tesseract
                processed_path = image_path + ".processed.jpg"
                cv2.imwrite(processed_path, thresh)
                img = Image.open(processed_path)
            else:
                img = Image.open(image_path)

            # Use configured TESSDATA_PREFIX if set, else rely on system defaults
            # Optimized config: --oem 3 (Default) --psm 3 (Fully auto page segmentation)
            config = "--oem 3 --psm 3"
            tess_prefix = os.getenv("TESSDATA_PREFIX")
            if tess_prefix:
                config += f' --tessdata-dir "{tess_prefix}"'
            
            text = pytesseract.image_to_string(img, config=config)
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
    # Try selectable text extraction (PyPDF2) first as it's faster and cleaner if text exists
    pypdf_text = ""
    num_pages = None
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(pdf_path)
        pages_text = []
        for page in reader.pages:
            try:
                pages_text.append(page.extract_text() or "")
            except Exception:
                pages_text.append("")
        pypdf_text = "\n\n".join(pages_text).strip()
        try:
            num_pages = len(reader.pages)
        except Exception:
            num_pages = None
    except Exception:
        pass

    # If PyPDF2 worked and got meaningful text, return it (lower threshold for short reports)
    if pypdf_text and len(pypdf_text) > 30:
        return pypdf_text

    # Otherwise, try OCR (pdf2image + tesseract) with optimized settings
    try:
        from pdf2image import convert_from_path, exceptions as pdf2image_exceptions

        # Higher DPI for better accuracy (300 is standard for OCR)
        dpi = int(os.getenv('PDF_DPI', '300'))
        # Cap pages to process to avoid long-running requests (can be tuned via env)
        max_pages = int(os.getenv('MAX_PDF_PAGES', '8'))
        poppler_path = None
        try:
            from shutil import which
            if which('pdftoppm'):
                poppler_path = os.path.dirname(which('pdftoppm'))
        except Exception:
            poppler_path = None

        # If we know page count and it's large, limit pages
        pages_to_process = None
        if num_pages and num_pages > max_pages:
            pages_to_process = list(range(0, min(num_pages, max_pages)))

        images = convert_from_path(pdf_path, dpi=dpi, thread_count=1, poppler_path=poppler_path)

        pages_text = []
        # Only process up to configured page cap
        for idx, img in enumerate(images):
            if pages_to_process is not None and idx not in pages_to_process:
                break
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
        ocr_text = "\n\n".join(pages_text).strip()
        if ocr_text:
            return ocr_text
    except Exception as e:
        print(f"OCR attempt failed: {e}")
    
    # Final fallback: return whatever PyPDF2 got, even if small
    if pypdf_text:
        return pypdf_text
        
    # If we got here, everything failed. Let's find out why.
    error_details = []
    if not pypdf_text:
        error_details.append("Text extraction (PyPDF2) returned no text.")
    
    # Check for binaries specifically to give clear instructions
    from shutil import which
    if not which("pdftoppm"):
        error_details.append("Missing 'poppler' (pdftoppm). Required for scanned PDFs.")
    if not which("tesseract"):
        error_details.append("Missing 'tesseract'. Required for OCR.")
        
    error_msg = " | ".join(error_details)
    raise RuntimeError(f"PDF Analysis Failed: {error_msg}. Please ensure your PDF is not a scanned image, or install 'poppler' and 'tesseract' for OCR support.")


def extract_entities(text):
    """Extract medical entities using global SciSpaCy model."""
    from collections import defaultdict
    
    findings = defaultdict(set)
    
    if nlp is None:
        # FALLBACK: Keyword based extraction
        import re
        keywords = {
            "DISEASE": ["diabetes", "hypertension", "anemia", "infection", "cancer", "tumor", "fever", "cough", "asthma"],
            "CHEMICAL": ["glucose", "hemoglobin", "cholesterol", "insulin", "aspirin", "penicillin", "vitamin"],
            "ANATOMY": ["heart", "lung", "liver", "kidney", "blood", "brain", "stomach"],
        }
        text_lower = text.lower()
        for label, words in keywords.items():
            for word in words:
                if re.search(r'\b' + word + r'\b', text_lower):
                    findings[label].add(word.capitalize())
        
        # Format as list for JSON response
        return {k: list(v) for k, v in findings.items()}

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


def clean_extracted_text(text):
    """Normalize OCR/text extraction output for readability."""
    import re
    if not text:
        return ""
    # Replace common ligatures and weird unicode artifacts
    clean = text.replace('\ufb01', 'fi').replace('\ufb02', 'fl')
    # Normalize newlines and remove excessive blank lines
    clean = re.sub(r'\r\n?', '\n', clean)
    clean = re.sub(r'\n{3,}', '\n\n', clean)
    # Remove repeated non-ASCII junk sequences
    clean = re.sub(r'[^\x00-\x7F]{3,}', ' ', clean)
    # Trim space on each line and collapse multiple spaces
    lines = [l.strip() for l in clean.splitlines()]
    lines = [re.sub(r'\s{2,}', ' ', l) for l in lines if l.strip()]
    return '\n'.join(lines).strip()


def extract_vitals(text):
    """Extract simple vitals (BP, HR, Temp, SpO2) using regex heuristics."""
    import re
    vitals = {}
    t = text.lower()

    # Blood pressure e.g., 120/80 mmHg or BP: 120/80
    bp = re.search(r'(?:bp[:\s]*|blood pressure[:\s]*)?(\d{2,3})\s*[/\\]\s*(\d{2,3})\s*(mmhg)?', t)
    if bp:
        vitals['blood_pressure'] = f"{bp.group(1)}/{bp.group(2)} mmHg"

    # Heart rate e.g., HR: 72 bpm or 72 bpm
    hr = re.search(r'(?:hr[:\s]*|heart rate[:\s]*)?(\d{2,3})\s*(bpm)?', t)
    if hr:
        val = hr.group(1)
        if val.isdigit() and 20 <= int(val) <= 220:
            vitals['heart_rate'] = f"{val} bpm"

    # Temperature e.g., 37.2 C or 99 F
    temp = re.search(r'(?:temp(?:erature)?[:\s]*)?(\d{2,2}(?:\.\d)?)\s*(c|f)?', t)
    if temp:
        vitals['temperature'] = f"{temp.group(1)} {temp.group(2) or 'C'}"

    # SpO2 e.g., 98% or SpO2: 98%
    spo2 = re.search(r'(?:spo2[:\s]*|oxygen saturation[:\s]*)?(\d{2,3})\s*%?', t)
    if spo2:
        val = spo2.group(1)
        try:
            intval = int(val)
            if 50 <= intval <= 100:
                vitals['spo2'] = f"{intval}%"
        except Exception:
            pass

    return vitals


def prettify_entities(entities):
    """Turn extracted entity groups into consistent, patient-friendly lists."""
    if not entities:
        return {}
    if isinstance(entities, dict) and 'warning' in entities:
        return entities
    pretty = {}
    for k, v in entities.items():
        # normalize keys to short readable labels
        key = k
        if k.lower().startswith('disease') or 'symptom' in k.lower():
            key = 'Diseases & Symptoms'
        elif 'medicat' in k.lower() or 'drug' in k.lower():
            key = 'Medications'
        elif k.lower() == 'other':
            key = 'Other Findings'
        pretty[key] = v
    return pretty


def simplify_medical_text(text):
    """Convert technical medical terms into simple, patient-friendly language."""
    simplification_map = {
        r'\bhypertension\b': 'high blood pressure',
        r'\bdiabetes mellitus\b': 'diabetes (high blood sugar)',
        r'\banemia\b': 'low iron or blood count',
        r'\bmyocardial infarction\b': 'heart attack',
        r'\bglucose\b': 'blood sugar',
        r'\bred blood cells\b': 'blood units that carry oxygen',
        r'\bwhite blood cells\b': 'blood units that fight infection',
        r'\bhemoglobin\b': 'protein that carries oxygen in blood',
        r'\bcholesterol\b': 'blood fat',
        r'\bedema\b': 'swelling caused by fluid',
        r'\bfatigue\b': 'extreme tiredness',
        r'\bdyspnea\b': 'shortness of breath',
        r'\belevated\b': 'higher than normal',
        r'\bdecreased\b': 'lower than normal',
        r'\bacute\b': 'sudden or short-term',
        r'\bchronic\b': 'long-term',
        r'\bbenign\b': 'non-cancerous',
        r'\bmalignant\b': 'cancerous',
        r'\bcardiac\b': 'heart-related',
        r'\bpulmonary\b': 'lung-related',
        r'\brenal\b': 'kidney-related',
        r'\bhepatic\b': 'liver-related',
        r'\bgastric\b': 'stomach-related',
        r'\bbilateral\b': 'on both sides',
        r'\bunilateral\b': 'on one side',
        r'\bidiopathic\b': 'cause is unknown',
        r'\bmetastasis\b': 'cancer that has spread',
        r'\btachycardia\b': 'fast heart rate',
        r'\bbradycardia\b': 'slow heart rate',
        r'\bhypoglycemia\b': 'low blood sugar',
        r'\bhyperglycemia\b': 'high blood sugar',
        r'\binflammation\b': 'swelling or redness',
        r'\bprognosis\b': 'expected outcome',
        r'\basymptomatic\b': 'showing no symptoms',
    }
    
    import re
    simplified = text.lower()
    for tech, simple in simplification_map.items():
        simplified = re.sub(tech, simple, simplified)
    
    return simplified.capitalize()


def summarize_text(text):
    """Summarize text using global transformers summarization pipeline."""
    # First, simplify the text for the patient
    text = simplify_medical_text(text)
    
    if summarizer is None:
        # FALLBACK: Simple extractive summary
        sentences = text.split('.')
        # Pick the first 3 sentences that are reasonably long
        summary_sentences = [s.strip() for s in sentences if len(s.strip()) > 30][:3]
        if not summary_sentences:
            return "This report contains clinical data and medical findings regarding the patient's condition."
        return ". ".join(summary_sentences) + "."

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
        final_summary = out[0]["summary_text"]
        return simplify_medical_text(final_summary)
    except Exception as e:
        print(f"Summarization error: {e}")
        return simplify_medical_text(text[:500]) # Fallback to simplified snippet


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
                tokenizer = MarianTokenizer.from_pretrained(model_name)
                model = MarianMTModel.from_pretrained(model_name)
                translation_models[model_name] = (tokenizer, model)
            
            tokenizer, model = translation_models[model_name]

        inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
        translated = model.generate(**inputs)
        return tokenizer.decode(translated[0], skip_special_tokens=True)
    except Exception as e:
        print(f"MarianMT failed, trying deep-translator: {e}")
        try:
            from deep_translator import GoogleTranslator
            # Force Arabic if translation specifically requested for Arabic or if it's the target
            translated = GoogleTranslator(source='auto', target=target_lang).translate(text)
            if translated:
                return translated
            raise RuntimeError("Deep Translator returned empty string")
        except Exception as de:
            print(f"Deep Translator failed: {de}")
            # Final fallback: return original text with a note
            return f"(English) {text}"


def analyze_with_gemini(text):
    """Use Gemini Pro to analyze medical text for summary, vitals, and entities."""
    if not client:
        return None

    try:
        prompt = f"""
        Analyze the following medical report text and provide:
        1. A patient-friendly summary (simple language).
        2. Extracted vitals (Blood Pressure, Heart Rate, Temperature, SpO2) in JSON format.
        3. Extracted medical entities (Diseases/Symptoms, Medications) in JSON format.
        
        Format the response EXACTLY as a JSON object:
        {{
            "summary": "...",
            "vitals": {{ "blood_pressure": "...", "heart_rate": "...", "temperature": "...", "spo2": "..." }},
            "entities": {{ "Diseases & Symptoms": [...], "Medications": [...] }}
        }}

        Medical Text:
        {text}
        """
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt
        )
        # Attempt to parse JSON from response
        import json
        import re
        content = response.text
        # Remove markdown code blocks if present
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        return None
    except Exception as e:
        print(f"Gemini analysis failed: {e}")
        return None


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

        # Clean and normalize the extracted text for readability
        cleaned = clean_extracted_text(text)

        entities = extract_entities(cleaned)
        # Check if entity extraction failed
        if isinstance(entities, dict) and "error" in entities:
            entities = {"warning": entities["error"]}

        entities_pretty = prettify_entities(entities)

        vitals = extract_vitals(cleaned)
        summary = summarize_text(cleaned)

        # Gemini Analysis if available
        gemini_result = analyze_with_gemini(cleaned)
        if gemini_result:
            summary = gemini_result.get("summary", summary)
            vitals = gemini_result.get("vitals", vitals)
            entities_pretty = gemini_result.get("entities", entities_pretty)

        target = request.form.get("translate_to", "ar")
        translation = translate_text(summary if isinstance(summary, str) else cleaned, target_lang=target)

        # Save to Database (guarded)
        saved = False
        resp = {
            # Legacy (original behaviour)
            "text": cleaned[:10000],  # limited snippet for compatibility
            "text_length": len(cleaned),
            # New clearer fields
            "raw_text": cleaned,
            "text_excerpt": cleaned[:1000],
            "entities": entities,  # raw entity output
            "entities_pretty": entities_pretty,  # normalized labels for UI
            "vitals": vitals,
            "summary": summary,
            "translation": translation,
        }

        if DB_AVAILABLE:
            try:
                new_report = Report(
                    original_text=cleaned,
                    summary=summary,
                    vitals=vitals,
                    entities=entities_pretty,
                    translation=translation
                )
                db.session.add(new_report)
                db.session.commit()
                saved = True
                resp["id"] = new_report.id
                try:
                    resp["created_at"] = new_report.created_at.isoformat()
                except Exception:
                    resp["created_at"] = None
            except OperationalError as oe:
                # Log details server-side, but show a friendly message to the patient
                print(f"DB write OperationalError: {oe}")
                db.session.rollback()
                return jsonify({"error": "Server error: unable to save report right now. Please try again later."}), 500
            except SQLAlchemyError as sqe:
                print(f"DB write error: {sqe}")
                db.session.rollback()
                return jsonify({"error": "Server error: unable to save report right now. Please try again later."}), 500
            except Exception as e:
                print(f"Unexpected DB error while saving report: {e}")
                db.session.rollback()
                return jsonify({"error": "Server error: unable to save report right now. Please try again later."}), 500
        else:
            # DB not available: return a user-friendly message but still provide analysis result
            resp["warning"] = "Analysis completed but server storage is currently unavailable. Please try again later."

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



# -------------------------------------------------------------------
# Database & Auth Configuration
# -------------------------------------------------------------------
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash

# Ensure instance directory exists and DB path is writable
INSTANCE_DIR = BASE_DIR / "instance"
INSTANCE_DIR.mkdir(parents=True, exist_ok=True)

# Use a local SQLite DB in the instance folder
db_path = INSTANCE_DIR / "ai_medical.db"
# Ensure the DB file exists so we can try to adjust permissions
try:
    if not db_path.exists():
        # create an empty file
        db_path.touch(mode=0o664, exist_ok=True)
    else:
        # attempt to make writable by owner/group
        try:
            os.chmod(db_path, 0o664)
        except Exception:
            pass
except Exception:
    # best-effort only; continue and let SQLAlchemy surface errors if any
    pass

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', f'sqlite:///{db_path}')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'super-secret-key-change-this-in-prod')

db = SQLAlchemy(app)
jwt = JWTManager(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'doctor' or 'patient'
    reports = db.relationship('Report', backref='owner', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Report(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True) # Optional for now
    patient_name = db.Column(db.String(120))
    original_text = db.Column(db.Text)
    summary = db.Column(db.Text)
    vitals = db.Column(db.JSON)
    entities = db.Column(db.JSON)
    translation = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

# Create DB and seed default users
DB_AVAILABLE = True
with app.app_context():
    try:
        db.create_all()
    except OperationalError as oe:
        DB_AVAILABLE = False
        print(f"Database initialization error: {oe}")
    except Exception as e:
        DB_AVAILABLE = False
        print(f"Unexpected DB init error: {e}")

    if DB_AVAILABLE:
        try:
            # Doctor default
            if not User.query.filter_by(username='doctor').first():
                doctor = User(username='doctor', role='doctor')
                doctor.set_password('medical')
                db.session.add(doctor)
                print("Created default doctor: doctor / medical")

            # Patient default
            if not User.query.filter_by(username='patient').first():
                patient = User(username='patient', role='patient')
                patient.set_password('medical')
                db.session.add(patient)
                print("Created default patient: patient / medical")

            db.session.commit()
        except SQLAlchemyError as sae:
            DB_AVAILABLE = False
            print(f"Database seeding/commit error: {sae}")
        except Exception as e:
            DB_AVAILABLE = False
            print(f"Unexpected DB seeding error: {e}")

# -------------------------------------------------------------------
# Auth Routes
# -------------------------------------------------------------------
@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'patient')  # default to patient

    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400
    
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 400
    
    new_user = User(username=username, role=role)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"message": "User created successfully"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401
    
    access_token = create_access_token(identity={'username': user.username, 'role': user.role})
    return jsonify({
        "access_token": access_token,
        "role": user.role,
        "username": user.username
    }), 200

@app.route('/reports', methods=['GET'])
# @jwt_required()  # Keep optional for initial testing
def get_reports():
    reports = Report.query.order_by(Report.created_at.desc()).all()
    output = []
    for report in reports:
        output.append({
            "id": report.id,
            "patient_name": report.patient_name,
            "summary": report.summary,
            "vitals": report.vitals,
            "entities": report.entities,
            "translation": report.translation,
            "created_at": report.created_at.isoformat()
        })
    return jsonify(output)

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
    try:
        checks["db_available"] = bool(DB_AVAILABLE)
        checks["db_path"] = str(db_path)
        # quick writable check
        try:
            checks["db_writable"] = os.access(str(db_path), os.W_OK)
        except Exception:
            checks["db_writable"] = False
    except Exception:
        checks["db_available"] = False
        checks["db_writable"] = False

    return jsonify(checks)


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    
    if debug:
        print("WARNING: Running in debug mode. This should NOT be used in production!")
    
    app.run(host="0.0.0.0", port=port, debug=debug)