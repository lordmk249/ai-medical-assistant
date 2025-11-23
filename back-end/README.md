# Backend (Flask)

This folder contains the backend API used by the project. The main application
lives at `back-end/app/main.py`.

Structure
- `app/` — main application package (Flask app and processing functions)
- `requirements.txt` — Python requirements
- `docs/SETUP.md` — notes for installing system deps (poppler, tesseract) and model tips

Recommended development setup (conda)

```bash
# create and activate environment
conda create -n ai-med-py311 python=3.11 -y
conda activate ai-med-py311

# install system binaries (poppler for pdf2image, tesseract for OCR)
conda install -c conda-forge poppler tesseract leptonica pkg-config -y

# install python deps
pip install -r requirements.txt
```

Configuration

This project uses external AI services. You must configure your API keys in a `.env` file.

1. Copy `config.example.env` to `.env`:
   ```bash
   cp config.example.env .env
   ```
2. Edit `.env` and add your keys:
   - **Google Cloud Vision**: Set `GOOGLE_APPLICATION_CREDENTIALS` to the path of your JSON key file.
   - **AWS Comprehend Medical**: Set `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_REGION`.
   - **Azure Translator**: Set `AZURE_TRANSLATOR_KEY`, `AZURE_TRANSLATOR_REGION`, and `AZURE_TRANSLATOR_ENDPOINT`.

Run the backend

```bash
cd back-end
python -m app.main
```

API Endpoints
- POST `/process` — upload image/pdf and optional `translate_to` form field.
	- Returns JSON with `text`, `entities`, `summary`, and `translation`.
- GET `/healthz` — health check

Notes & troubleshooting
- If PDF uploads fail with "Unable to get page count" or similar, it usually means
	poppler (`pdfinfo`/`pdftoppm`) is not installed or not on PATH. See `docs/SETUP.md`
	for conda/brew install instructions.
- SciSpaCy models are large; install the model `en_ner_bc5cdr_md` via pip if not
	included in `requirements.txt`.

Environment variables
- Copy `config.example.env` to `.env` for local overrides.

