#!/bin/bash

# ===========================================
# AI Engine Production Startup Script
# Starts AI engine and Cloudflare Tunnel
# ===========================================

echo "🚀 Starting SwapSafe AI Engine for Production..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo -e "${RED}❌ cloudflared not installed${NC}"
    echo "Install with: brew install cloudflare/cloudflare/cloudflared"
    exit 1
fi

# Check if Python venv exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}⚠️  Virtual environment not found. Creating...${NC}"
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Stop any existing processes
echo "🔄 Stopping any existing processes..."
pkill -f "uvicorn main:app" 2>/dev/null || true
pkill -f "cloudflared tunnel" 2>/dev/null || true
sleep 2

# Start AI Engine in background
echo -e "${GREEN}🧠 Starting AI Engine on port 8000...${NC}"
uvicorn main:app --host 0.0.0.0 --port 8000 &
AI_PID=$!

# Wait for AI Engine to start
sleep 3

# Check if AI Engine is running
if curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}✅ AI Engine is running!${NC}"
else
    echo -e "${RED}❌ AI Engine failed to start${NC}"
    exit 1
fi

# Start Cloudflare Tunnel
echo -e "${GREEN}🌐 Starting Cloudflare Tunnel...${NC}"
cloudflared tunnel --url http://localhost:8000 2>&1 | tee tunnel.log &
TUNNEL_PID=$!

# Wait for tunnel URL
sleep 5
TUNNEL_URL=$(grep -o 'https://[^.]*\.trycloudflare\.com' tunnel.log | head -1)

if [ -n "$TUNNEL_URL" ]; then
    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}🎉 AI ENGINE IS NOW LIVE!${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    echo -e "Tunnel URL: ${YELLOW}$TUNNEL_URL${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Add this URL to Render:${NC}"
    echo "   Variable: AI_ENGINE_URL"
    echo "   Value: $TUNNEL_URL"
    echo ""
    echo "Then redeploy your Render backend."
    echo ""
    echo "Press Ctrl+C to stop both services."
    
    # Copy URL to clipboard if pbcopy available (macOS)
    if command -v pbcopy &> /dev/null; then
        echo "$TUNNEL_URL" | pbcopy
        echo -e "${GREEN}📋 Tunnel URL copied to clipboard!${NC}"
    fi
    
    # Keep running
    wait $AI_PID
else
    echo -e "${RED}❌ Could not get tunnel URL${NC}"
    cat tunnel.log
fi
