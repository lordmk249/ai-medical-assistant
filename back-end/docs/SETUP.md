# Backend setup notes

This project uses Tesseract OCR and SciSpaCy + Transformers. Some pieces require system packages.

1) Recommended: use conda and install tesseract from conda-forge to avoid system brew conflicts:

```bash
conda create -n ai-med-py311 python=3.11 -y
conda activate ai-med-py311
conda install -c conda-forge tesseract leptonica poppler pkg-config -y
pip install -r requirements.txt
```

2) If you prefer Homebrew (macOS):

```bash
# install poppler (for pdf2image)
brew install poppler
# install tesseract (may require fixing link conflicts as noted earlier)
brew install tesseract
```

3) SciSpaCy model installation (if requirements.txt method fails):

```bash
pip install scispacy
pip install https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/en_ner_bc5cdr_md-0.5.1.tar.gz
```

4) Note about transformers: many models require `torch`. Install the appropriate `torch` wheel for your platform (see https://pytorch.org/get-started/locally/).
