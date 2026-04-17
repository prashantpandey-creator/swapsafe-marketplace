#!/bin/bash
echo "🚀 Starting SwapSafe Marketplace Development Environment..."

# 1. Start Python AI Engine (Port 8001)
echo "🧠 [1/3] Launching AI Engine..."
cd ai-engine
# Ensure venv exists
if [ ! -d "venv" ]; then
    echo "📦 Creating venv..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi
# Run in background
nohup uvicorn main:app --reload --port 8001 > ai_engine.log 2>&1 &
AI_PID=$!
echo "✅ AI Engine started (PID: $AI_PID)"
cd ..

# 2. Start Node.js Backend (Port 5000)
echo "🌐 [2/3] Launching Backend Server..."
cd server
npm install --silent
# Run in background
nohup npm run dev > backend.log 2>&1 &
NODE_PID=$!
echo "✅ Backend Server started (PID: $NODE_PID)"
cd ..

# 3. Start Frontend (Port 3000/5173)
echo "🖥️ [3/3] Launching Frontend..."
npm install --silent
npm run dev -- --host

# Cleanup on exit
trap "kill $AI_PID $NODE_PID" EXIT
