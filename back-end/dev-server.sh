#!/usr/bin/env bash
# Dev helper: activate conda env and run backend
# Usage: ./dev-server.sh [env_name]

ENV_NAME=${1:-ai-med-py311}

# Check for local virtual environment first
if [ -f ".venv/bin/activate" ]; then
  echo "Found virtual environment in .venv. Activating..."
  source .venv/bin/activate
elif [ -f "venv/bin/activate" ]; then
  echo "Found virtual environment in venv. Activating..."
  source venv/bin/activate
elif command -v conda >/dev/null 2>&1; then
  echo "Using conda to activate environment '${ENV_NAME}'"
  source "$(conda info --base)/etc/profile.d/conda.sh"
  conda activate "${ENV_NAME}" || {
    echo "Failed to activate conda env '${ENV_NAME}'"
    exit 1
  }
else
  echo "No virtual environment found (.venv or venv) and conda not available."
  echo "Please activate your environment manually."
  exit 1
fi

cd "$(dirname "$0")"
python -m app.main
