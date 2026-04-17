#!/bin/bash

# Ensure we are in the ai-engine directory
cd "$(dirname "$0")"

echo "🍎 Starting Guardian AI Engine (Apple Silicon Mode)..."

# Check if venv exists, if not create it (Optional, but good practice)
if [ ! -d "venv" ]; then
    echo "📦 Creating Python Virtual Environment..."
    python3 -m venv venv
    source venv/bin/activate
    echo "⬇️ Installing Dependencies..."
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Run the server
# --reload enables hot-reloading for development
uvicorn main:app --reload --port 8001
