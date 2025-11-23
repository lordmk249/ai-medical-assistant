# AI Medical Assistant

## Project Structure

- `back-end/` — Python backend (Flask/FastAPI)
- `my-react-tailwind-app/` — React frontend (with Tailwind CSS)

## Quickstart

````markdown
# AI Medical Assistant

This repository contains a Flask-based backend for OCR / NER / summarization / translation
and a React + Tailwind frontend app skeleton in `my-react-tailwind-app/`.

If you're a frontend developer joining the project, the backend exposes a small HTTP API
you can target during UI development (no external paid APIs required).

Project layout
- `back-end/` — Python backend (Flask). The main app entry is `back-end/app/main.py`.
- `my-react-tailwind-app/` — React + Vite + Tailwind frontend skeleton.

Backend API (quick contract)
- POST /process
	- Content-Type: multipart/form-data
	- Form fields:
		- `file` (required): uploaded file (image or PDF)
		- `translate_to` (optional): two-letter target language code (e.g. `ar`)
	- Response (JSON):
		- `text`: extracted text (string)
		- `entities`: extracted entities (list of {text, label}) or an error object
		- `summary`: summarized text (string) or error object
		- `translation`: translated summary (string) or error object

- GET /healthz → {status: "ok"}

Recommended local dev workflow (backend)
1. Use conda (recommended) to create an isolated Python 3.11 environment:

```bash
conda create -n ai-med-py311 python=3.11 -y
conda activate ai-med-py311
conda install -c conda-forge poppler tesseract leptonica pkg-config -y
pip install -r back-end/requirements.txt
```markdown
# AI MEDICAL ASSISTANT — FREE VERSION

This repository implements a free, local-only version of a smart medical assistant. It
extracts text from medical reports (images or PDFs), finds medical entities using
SciSpaCy, summarizes with local transformer models, and translates using MarianMT.

The goal: a backend the frontend can call to get both a doctor-facing summary and a
patient-friendly simplified version — all using free tools (no paid cloud APIs).

DETAILED STEP-BY-STEP (FREE)

STEP 1 — Install All Required Tools (FREE)
1. Install Python (FREE) — https://python.org (check "Add Python to PATH")
2. Install Node.js (FREE) — https://nodejs.org
3. Install Visual Studio Code (FREE) — https://code.visualstudio.com
4. Install Git (FREE) — https://git-scm.com

Restart your computer after installing these tools.

STEP 2 — Create Backend (Python)
1. Create folder: `back-end` (already present)
2. Create and activate an environment (recommended: conda or venv):

```bash
# conda (recommended):
conda create -n ai-med-py311 python=3.11 -y
conda activate ai-med-py311

# or venv:
python -m venv venv
source venv/bin/activate
```

3. Install required Python libraries:

```bash
# recommended: install system binaries first (poppler, tesseract)
conda install -c conda-forge poppler tesseract leptonica pkg-config -y

# then install Python deps
pip install -r back-end/requirements.txt
```

STEP 3 — FREE OCR (Tesseract)
Use `pytesseract` and `Pillow`. Ensure the `tesseract` binary is installed (via conda-forge or brew).

STEP 4 — FREE Medical Entity Extraction
Use SciSpaCy and the `en_ner_bc5cdr_md` model. Install via pip if not in `requirements.txt`:

```bash
pip install scispacy
pip install https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/en_ner_bc5cdr_md-0.5.1.tar.gz
```

STEP 5 — FREE Summarization
Use local `transformers` pipelines (may need `torch` installed matching your platform).

STEP 6 — FREE Translation
Use MarianMT (`transformers` + `sentencepiece`) for en→ar or other languages.

STEP 7 — Backend API (already implemented)
- POST `/process` (or `/analyze`) — multipart form with `file` and optional `translate_to`.
- GET `/healthz` — returns runtime checks (pdfinfo/tesseract/spacy/transformers presence).

STEP 8 — Frontend (React)
Start the frontend in `my-react-tailwind-app/`:

```bash
cd my-react-tailwind-app
npm install
npm run dev
```

The demo UI is a placeholder and posts to `/process` (or `/analyze`). You can replace
it later with the final design.

STEP 9 — Testing
Test OCR, entity extraction, summarization, translation, and end-to-end flow.

STEP 10 — Deployment (FREE OPTIONS)
Frontend: Netlify, Vercel
Backend: Render, Replit, or a small VPS

This repository is already wired to use the free toolchain. See `back-end/README.md` and
`back-end/docs/SETUP.md` for more detailed install tips.
```