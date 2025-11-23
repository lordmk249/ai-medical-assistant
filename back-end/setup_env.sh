#!/usr/bin/env bash
# Setup helper for backend environment (conda recommended). Run from repo root.
# Usage: ./back-end/setup_env.sh [conda|venv]

MODE=${1:-conda}
ENV_NAME=${2:-ai-med-py311}

set -e

if [ "$MODE" = "conda" ]; then
  if ! command -v conda >/dev/null 2>&1; then
    echo "Conda not found. Install Miniconda or Anaconda first: https://docs.conda.io/en/latest/miniconda.html"
    exit 1
  fi
  echo "Creating conda environment '${ENV_NAME}' with Python 3.11..."
  conda create -n "${ENV_NAME}" python=3.11 -y
  echo "Activating ${ENV_NAME}..."
  # shellcheck disable=SC1091
  source "$(conda info --base)/etc/profile.d/conda.sh"
  conda activate "${ENV_NAME}"
  echo "Installing system binaries via conda-forge (poppler, tesseract)..."
  conda install -c conda-forge poppler tesseract leptonica pkg-config -y
  echo "Installing Python requirements..."
  pip install --upgrade pip
  pip install -r requirements.txt
  echo "Backend environment ready. Activate with: conda activate ${ENV_NAME}"
  exit 0
fi

if [ "$MODE" = "venv" ]; then
  echo "Creating venv in back-end/venv..."
  python3 -m venv back-end/venv
  echo "Activating venv..."
  # shellcheck disable=SC1091
  source back-end/venv/bin/activate
  echo "Installing Python requirements..."
  pip install --upgrade pip
  pip install -r back-end/requirements.txt
  echo "Virtualenv setup complete. Activate with: source back-end/venv/bin/activate"
  exit 0
fi

echo "Unknown mode: ${MODE}. Use 'conda' or 'venv'."
exit 2
