#!/usr/bin/env bash
# Dev helper: activate conda env and run backend
# Usage: ./dev-server.sh [env_name]

ENV_NAME=${1:-ai-med-py311}

if command -v conda >/dev/null 2>&1; then
  echo "Using conda to activate environment '${ENV_NAME}'"
  # shellcheck disable=SC1091
  source "$(conda info --base)/etc/profile.d/conda.sh"
  conda activate "${ENV_NAME}" || {
    echo "Failed to activate conda env '${ENV_NAME}'. Create it with:"
    echo "  conda create -n ${ENV_NAME} python=3.11 -y"
    exit 1
  }
else
  echo "Conda not found in PATH. Activate your Python environment manually and run:"
  echo "  python -m app.main"
  exit 1
fi

cd "$(dirname "$0")"
python -m app.main
