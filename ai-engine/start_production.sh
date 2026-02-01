#!/bin/bash

# ===========================================
# AI Engine + Auto-Update Render Script
# Starts tunnel and updates Render automatically
# ===========================================

echo "🚀 Starting SwapSafe AI Engine..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# ==========================================
# CONFIGURATION - Set your Render API key
# ==========================================
# Get your API key from: https://dashboard.render.com/u/settings#api-keys
RENDER_API_KEY="${RENDER_API_KEY:-}"
RENDER_SERVICE_ID="${RENDER_SERVICE_ID:-}"  # Find in Render dashboard URL

# ==========================================

# Activate Python venv
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo -e "${RED}❌ No venv found. Run: python3 -m venv venv && pip install -r requirements.txt${NC}"
    exit 1
fi

# Stop existing processes
pkill -f "uvicorn main:app" 2>/dev/null || true
pkill -f "cloudflared tunnel" 2>/dev/null || true
sleep 2

# Start AI Engine
echo -e "${GREEN}🧠 Starting AI Engine on port 8000...${NC}"
uvicorn main:app --host 0.0.0.0 --port 8000 &
AI_PID=$!
sleep 3

# Check AI Engine
if ! curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${RED}❌ AI Engine failed to start${NC}"
    exit 1
fi
echo -e "${GREEN}✅ AI Engine running${NC}"

# Start Cloudflare Tunnel
echo -e "${GREEN}🌐 Starting Cloudflare Tunnel...${NC}"
cloudflared tunnel --url http://localhost:8000 2>&1 | tee tunnel.log &
TUNNEL_PID=$!

# Wait for tunnel URL
sleep 8
TUNNEL_URL=$(grep -o 'https://[^.]*\.trycloudflare\.com' tunnel.log | head -1)

if [ -z "$TUNNEL_URL" ]; then
    echo -e "${RED}❌ Could not get tunnel URL${NC}"
    cat tunnel.log
    exit 1
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}🎉 AI ENGINE IS LIVE!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "Tunnel URL: ${CYAN}$TUNNEL_URL${NC}"
echo ""

# Copy to clipboard (macOS)
if command -v pbcopy &> /dev/null; then
    echo "$TUNNEL_URL" | pbcopy
    echo -e "${GREEN}📋 URL copied to clipboard!${NC}"
fi

# Auto-update Render if API key is set
if [ -n "$RENDER_API_KEY" ] && [ -n "$RENDER_SERVICE_ID" ]; then
    echo ""
    echo -e "${YELLOW}📡 Updating Render environment variable...${NC}"
    
    # Update env var via Render API
    curl -s -X PUT "https://api.render.com/v1/services/$RENDER_SERVICE_ID/env-vars/AI_ENGINE_URL" \
        -H "Authorization: Bearer $RENDER_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"value\": \"$TUNNEL_URL\"}" > /dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Render updated! Triggering redeploy...${NC}"
        
        # Trigger redeploy
        curl -s -X POST "https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys" \
            -H "Authorization: Bearer $RENDER_API_KEY" > /dev/null
        
        echo -e "${GREEN}✅ Redeploy triggered!${NC}"
    else
        echo -e "${RED}❌ Failed to update Render${NC}"
    fi
else
    echo ""
    echo -e "${YELLOW}⚠️  MANUAL STEP: Update Render with new URL${NC}"
    echo -e "   Go to Render dashboard → Environment → AI_ENGINE_URL"
    echo -e "   Set to: ${CYAN}$TUNNEL_URL${NC}"
    echo ""
    echo -e "${CYAN}TIP: To automate this, set these environment variables:${NC}"
    echo "   export RENDER_API_KEY='your-api-key'"
    echo "   export RENDER_SERVICE_ID='your-service-id'"
fi

echo ""
echo "Press Ctrl+C to stop."
echo ""

# Keep running
wait $AI_PID
