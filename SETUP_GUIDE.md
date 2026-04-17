# SwapSafe Marketplace - Complete Setup Guide

## Prerequisites

- Node.js 18+ installed
- Python 3.9+ installed
- MongoDB installed locally OR MongoDB Atlas account
- npm installed

---

## Part 1: Local Development Setup

### Frontend (React + Vite)

```bash
cd /path/to/marketplace
npm install
npm run dev
# Runs at http://localhost:3000
```

### Backend (Express + MongoDB)

```bash
cd server
npm install

# Create .env file in server/ directory:
MONGODB_URI=mongodb://localhost:27017/swapsafe-marketplace
JWT_SECRET=your-secret-key-here
AI_ENGINE_URL=http://localhost:8001
AI_PROVIDER=groq
VISION_PROVIDER=gemini
# Groq API key (free): https://console.groq.com/
GROQ_API_KEY=your-groq-key-here
# Gemini API key (for vision): https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your-gemini-key-here

npm start
# Runs at http://localhost:5000
```

### AI Engine (FastAPI + Python)

```bash
cd ai-engine

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start AI engine
python main.py
# Runs at http://localhost:8001
```

**Verify AI Engine is Running:**
```bash
curl http://localhost:8001/
# Should return: {"status":"online","engine":"Guardian AI"}
```

---

## Part 2: MongoDB Database Setup

### Option A: Local MongoDB

1. **Install MongoDB Community Edition:**
   - Mac: `brew install mongodb-community`
   - Windows: Download from mongodb.com
   - Linux: `sudo apt-get install mongodb`

2. **Start MongoDB:**
   ```bash
   # Mac/Linux
   mongod --dbpath ~/data/db

   # Windows
   "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath C:\data\db
   ```

3. **Create Database:**
   ```bash
   # MongoDB Shell
   mongosh

   use swapsafe-marketplace
   db.createUser({
     user: "swapsafe",
     pwd: "your-password",
     roles: ["readWrite"]
   })
   exit
   ```

4. **Update .env:**
   ```
   MONGODB_URI=mongodb://swapsafe:your-password@localhost:27017/swapsafe-marketplace
   ```

### Option B: MongoDB Atlas (Cloud)

1. **Create Free Account:**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up and create a free cluster (M0)

2. **Get Connection String:**
   - Database Access: Create database user
   - Network Access: Whitelist IP 0.0.0.0/0 (for development)
   - Click "Connect" → "Drivers" → Copy connection string

3. **Update .env:**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/swapsafe-marketplace
   ```

---

## Part 3: AI Engine Setup

### Install Python Dependencies

```bash
cd ai-engine

# Create .env file in ai-engine/ directory:
MODEL_PATH=./models
DEVICE=cpu  # or 'cuda' if you have NVIDIA GPU

# For Groq (text AI - fast, free):
GROQ_API_KEY=your-groq-key

# For Gemini (vision AI):
GEMINI_API_KEY=your-gemini-key
```

### Download AI Models (Optional - for local models)

```bash
cd ai-engine
mkdir -p models

# For Ollama (local LLM):
brew install ollama  # Mac
ollama pull llama2

# Start Ollama:
ollama serve
```

### Test AI Engine Endpoints

```bash
# Start AI engine
cd ai-engine
python main.py

# Test health (in another terminal)
curl http://localhost:8001/health

# Test background removal
curl -X POST http://localhost:8001/api/v1/studio/enhance \
  -F "image=@test.jpg" \
  -F "prompt=remove background"
```

---

## Part 4: Render Production Setup

### Update Render Environment Variables

Go to Render Dashboard → Your Backend Service → Environment:

```bash
# Required Variables:
MONGODB_URI=mongodb+srv://your-atlas-connection-string
JWT_SECRET=your-secure-random-string
AI_ENGINE_URL=https://your-cloudflare-tunnel-url

# API Keys:
GROQ_API_KEY=your-groq-key
GEMINI_API_KEY=your-gemini-key
AI_PROVIDER=groq
VISION_PROVIDER=gemini
```

### Cloudflare Tunnel for AI Engine

**Why:** AI engine runs locally, needs to be accessible by Render backend.

1. **Install Cloudflare Tunnel:**
   ```bash
   brew install cloudflare/cloudflare/cloudflared  # Mac
   # Or download from: https://developers.cloudflare.com/cloudflare-one/connections/installing/installation/
   ```

2. **Start Tunnel:**
   ```bash
   cloudflared tunnel --url http://localhost:8001
   ```

3. **Copy the tunnel URL** and update `AI_ENGINE_URL` in Render backend

4. **Important:** Tunnel URL changes on every restart - must update in Render!

---

## Part 5: Complete Development Workflow

### Start All Services

```bash
# Terminal 1: Frontend
cd /path/to/marketplace
npm run dev
# http://localhost:3000

# Terminal 2: Backend
cd server
npm start
# http://localhost:5000

# Terminal 3: AI Engine
cd ai-engine
python main.py
# http://localhost:8001

# Terminal 4: MongoDB (if local)
mongod --dbpath ~/data/db
```

### Verify Setup

1. **Frontend:** Open http://localhost:3000
2. **API Health:** curl http://localhost:5000/api/ai/status
3. **AI Engine:** curl http://localhost:8001/
4. **MongoDB:** mongosh (should connect)

---

## Part 6: Common Issues & Fixes

### Issue: AI functionality not working

**Symptoms:** Background removal fails, AI price estimate doesn't work

**Fixes:**
1. Check if AI engine is running: `curl http://localhost:8001/`
2. Check backend logs for errors
3. Verify `AI_ENGINE_URL` in server/.env
4. Check API keys are set (GROQ_API_KEY, GEMINI_API_KEY)

### Issue: Database connection errors

**Symptoms:** "MongoServerError", "Connection refused"

**Fixes:**
1. Ensure MongoDB is running
2. Check MONGODB_URI in server/.env
3. For Atlas: Check IP whitelist includes your current IP

### Issue: Theme indicator not working

**Fixes:**
1. Hard refresh browser (Cmd/Ctrl + Shift + R)
2. Check browser console for errors
3. Verify Header.jsx has ThemeIndicator import

### Issue: Psychedelic theme is black screen

**This is normal!** The psychedelic theme starts with a black screen for 1 second, then slowly evolves. Wait 5-10 seconds to see the spiral appear.

---

## Part 7: Testing the Marketplace

### Create Test Listing

1. Navigate to http://localhost:3000
2. Click "Sell" → "Quick Sell"
3. Upload an image
4. Fill in product details
5. Click "Create Pro Photo" to test AI background removal
6. Click "List Item"

### Test AI Features

1. **Price Estimation:**
   - Fill in title, category, condition
   - Click "Get AI Estimate"

2. **Background Removal:**
   - Upload product photo
   - Click "Remove Background" or "Create Pro Photo"

3. **Theme System:**
   - Hover over theme button (small colored dot)
   - Click to cycle through 6 themes
   - Test psychedelic theme (black → spiral)

---

## Part 8: Deployment Checklist

### Before Deploying to Production:

- [ ] Update `MONGODB_URI` to production Atlas cluster
- [ ] Set secure `JWT_SECRET` (32+ random characters)
- [ ] Update `AI_ENGINE_URL` to current Cloudflare tunnel
- [ ] Add API keys to Render environment variables
- [ ] Test all AI endpoints locally
- [ ] Verify database migrations work
- [ ] Test user registration/login
- [ ] Test image upload and background removal

### Deploy Commands:

```bash
# Frontend to Vercel:
npm run build
vercel --prod

# Backend to Render:
git push origin main  # Auto-deploys on push

# AI Engine: Start Cloudflare tunnel locally
cloudflared tunnel --url http://localhost:8001
# Update AI_ENGINE_URL in Render after getting new tunnel URL
```

---

## Quick Start Script (Mac/Linux)

Create `start-all.sh`:

```bash
#!/bin/bash

# Start MongoDB
echo "🍃 Starting MongoDB..."
mongod --dbpath ~/data/db --fork --logpath ~/mongodb.log

# Start AI Engine
echo "🤖 Starting AI Engine..."
cd ai-engine
python main.py &
AI_PID=$!
cd ..

# Start Backend
echo "🔧 Starting Backend..."
cd server
npm start &
BACKEND_PID=$!
cd ..

# Start Frontend
echo "🎨 Starting Frontend..."
npm run dev &
FRONTEND_PID=$!

echo "✅ All services started!"
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:5000"
echo "AI Engine: http://localhost:8001"

# Cleanup on exit
trap "kill $AI_PID $BACKEND_PID $FRONTEND_PID; exit" INT TERM

wait
```

Run: `chmod +x start-all.sh && ./start-all.sh`

---

## Troubleshooting Commands

```bash
# Check what's running on ports
lsof -i :3000  # Frontend
lsof -i :5000  # Backend
lsof -i :8001  # AI Engine
lsof -i :27017 # MongoDB

# Kill processes
kill -9 <PID>

# View logs
tail -f server/debug.log
tail -f ai-engine/app.log

# Test API endpoints
curl http://localhost:5000/api/ai/status
curl http://localhost:8001/health

# MongoDB Shell
mongosh mongodb://localhost:27017/swapsafe-marketplace
```

---

## Support

For issues or questions:
- Check GitHub Issues: https://github.com/prashantpandey-creator/swapsafe-marketplace/issues
- Review BUGS.md and FEATURES.md
- Check AI_STRATEGY.md for architecture details
