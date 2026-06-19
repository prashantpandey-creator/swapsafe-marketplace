#!/bin/bash
set -e

# ── SwapSafe Marketplace — Hetzner One-Shot Setup ────────────
# Run this on your Hetzner VPS (204.168.176.229):
#   curl -sSL https://raw.githubusercontent.com/prashantpandey-creator/swapsafe-marketplace/claude/local-dev-setup-rKx44/setup-hetzner.sh | bash

echo "========================================="
echo "  SwapSafe Marketplace — Hetzner Setup"
echo "========================================="

# ── 1. Clone repo ────────────────────────────────────────────
echo ""
echo "[1/5] Cloning repository..."
cd /root
if [ -d "swapsafe-marketplace" ]; then
    echo "  Directory exists, pulling latest..."
    cd swapsafe-marketplace
    git fetch origin
    git checkout claude/local-dev-setup-rKx44
    git pull origin claude/local-dev-setup-rKx44
else
    git clone https://github.com/prashantpandey-creator/swapsafe-marketplace.git
    cd swapsafe-marketplace
    git checkout claude/local-dev-setup-rKx44
fi

# ── 2. Grab API keys from PuranGPT ──────────────────────────
echo ""
echo "[2/5] Copying API keys from PuranGPT..."

GROQ_KEY=""
GEMINI_KEY=""

# Try PuranGPT .env
if [ -f /root/purangpt/.env ]; then
    GROQ_KEY=$(grep -m1 "^GROQ_API_KEY=" /root/purangpt/.env | cut -d'=' -f2-)
    GEMINI_KEY=$(grep -m1 "^GEMINI_API_KEY=" /root/purangpt/.env | cut -d'=' -f2-)
    echo "  Found keys in /root/purangpt/.env"
fi

# Fallback: check docker-compose or other locations
if [ -z "$GROQ_KEY" ] && [ -f /root/purangpt/docker-compose.yml ]; then
    GROQ_KEY=$(grep -m1 "GROQ_API_KEY" /root/purangpt/docker-compose.yml | sed 's/.*=//' | tr -d ' "')
    echo "  Found key in docker-compose.yml"
fi

if [ -z "$GROQ_KEY" ]; then
    echo "  WARNING: Could not find GROQ_API_KEY from PuranGPT."
    echo "  You'll need to edit server/.env and ai-engine/.env manually."
fi

# Generate a random JWT secret
JWT_SECRET=$(openssl rand -hex 32)

# ── 3. Create server/.env ────────────────────────────────────
echo ""
echo "[3/5] Creating environment files..."

cat > server/.env << ENVEOF
MONGODB_URI=mongodb://mongo:27017/swapsafe
JWT_SECRET=${JWT_SECRET}
GROQ_API_KEY=${GROQ_KEY}
GEMINI_API_KEY=${GEMINI_KEY}
OPENAI_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
PORT=5000
AI_ENGINE_URL=http://ai-engine:8001
CLIENT_URL=http://204.168.176.229:3001
REDIS_HOST=redis
REDIS_PORT=6379
USE_REDIS=true
ENVEOF

echo "  Created server/.env"

# ── 4. Create ai-engine/.env ────────────────────────────────
cat > ai-engine/.env << ENVEOF
DEVICE=cpu
MODEL_PATH=./models
GROQ_API_KEY=${GROQ_KEY}
GEMINI_API_KEY=${GEMINI_KEY}
CLIENT_URL=http://204.168.176.229:3001
ENVEOF

echo "  Created ai-engine/.env"

# ── 5. Build and launch ─────────────────────────────────────
echo ""
echo "[4/5] Building Docker containers (this may take a few minutes)..."
docker compose build

echo ""
echo "[5/5] Starting SwapSafe..."
docker compose up -d

echo ""
echo "========================================="
echo "  SwapSafe is starting up!"
echo "========================================="
echo ""
echo "  Frontend:   http://204.168.176.229:3001"
echo "  Backend:    http://204.168.176.229:5000"
echo "  AI Engine:  http://204.168.176.229:8001"
echo ""
echo "  Check status:  docker compose ps"
echo "  View logs:     docker compose logs -f"
echo ""

# Wait and verify
sleep 5
echo "Container status:"
docker compose ps
