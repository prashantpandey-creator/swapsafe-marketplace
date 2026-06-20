#!/bin/bash
set -e

# ── SwapSafe Marketplace — Hetzner One-Shot Setup ────────────
# Run this on your Hetzner VPS (204.168.176.229):
#   curl -sSL https://raw.githubusercontent.com/prashantpandey-creator/swapsafe-marketplace/claude/local-dev-setup-rKx44/setup-hetzner.sh | bash
#
# SECURITY: Only the frontend (port 3010) is published to the public internet.
# Mongo/Redis/backend/ai-engine bind to 127.0.0.1 and run with auth. See SECURITY.md.

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

# Generate secrets
JWT_SECRET=$(openssl rand -hex 32)
MONGO_USER=swapsafe
MONGO_PASS=$(openssl rand -hex 24)
REDIS_PASS=$(openssl rand -hex 24)

# ── 3. Create env files ──────────────────────────────────────
echo ""
echo "[3/5] Creating environment files..."

# Root .env — read by docker-compose for ${MONGO_*}/${REDIS_PASSWORD} substitution
cat > .env << ENVEOF
MONGO_INITDB_ROOT_USERNAME=${MONGO_USER}
MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASS}
REDIS_PASSWORD=${REDIS_PASS}
ENVEOF
chmod 600 .env

cat > server/.env << ENVEOF
MONGODB_URI=mongodb://${MONGO_USER}:${MONGO_PASS}@mongo:27017/swapsafe?authSource=admin
JWT_SECRET=${JWT_SECRET}
MONGO_INITDB_ROOT_USERNAME=${MONGO_USER}
MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASS}
REDIS_PASSWORD=${REDIS_PASS}
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
CLIENT_URL=http://204.168.176.229:3010
REDIS_HOST=redis
REDIS_PORT=6379
USE_REDIS=true
ENVEOF
chmod 600 server/.env
echo "  Created server/.env"

# ── 4. Create ai-engine/.env ────────────────────────────────
cat > ai-engine/.env << ENVEOF
DEVICE=cpu
MODEL_PATH=./models
GROQ_API_KEY=${GROQ_KEY}
GEMINI_API_KEY=${GEMINI_KEY}
CLIENT_URL=http://204.168.176.229:3010
ENVEOF
chmod 600 ai-engine/.env
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
echo "  Public:     http://204.168.176.229:3010   (frontend only)"
echo "  Internal:   backend :5000 / ai-engine :8001 / mongo :27017 / redis :6379"
echo "              (all bound to 127.0.0.1 — not reachable from the internet)"
echo ""
echo "  Check status:  docker compose ps"
echo "  View logs:     docker compose logs -f"
echo ""

# Wait and verify
sleep 5
echo "Container status:"
docker compose ps
