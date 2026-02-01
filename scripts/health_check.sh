#!/bin/bash

# ===========================================
# SwapSafe Health Check Script
# Run this to check all services
# ===========================================

echo "🏥 SwapSafe Health Check"
echo "========================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
BACKEND_URL="${BACKEND_URL:-http://localhost:5000}"
AI_ENGINE_URL="${AI_ENGINE_URL:-http://localhost:8000}"

ISSUES_FOUND=0

check_service() {
    local name=$1
    local url=$2
    local endpoint=$3
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url$endpoint" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ $name${NC} - $url$endpoint"
        return 0
    else
        echo -e "${RED}❌ $name${NC} - $url$endpoint (HTTP $response)"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
        return 1
    fi
}

echo "📡 Checking Services..."
echo ""

# Frontend
check_service "Frontend" "$FRONTEND_URL" "/"

# Backend
check_service "Backend API" "$BACKEND_URL" "/api/health"
check_service "Backend Auth" "$BACKEND_URL" "/api/auth/status"
check_service "Backend AI" "$BACKEND_URL" "/api/ai/status"

# AI Engine
check_service "AI Engine" "$AI_ENGINE_URL" "/health"
check_service "AI Studio" "$AI_ENGINE_URL" "/api/v1/studio/health"

echo ""
echo "========================"

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}🎉 All services healthy!${NC}"
else
    echo -e "${RED}⚠️  Found $ISSUES_FOUND issue(s)${NC}"
fi

echo ""
echo "Production URLs:"
echo "  Frontend: https://swapsafe-marketplace.vercel.app"
echo "  Backend:  https://swapsafe-backend.onrender.com"
echo ""

# Check production if local passes
if [ $ISSUES_FOUND -eq 0 ]; then
    echo "📡 Checking Production..."
    echo ""
    
    PROD_FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://swapsafe-marketplace.vercel.app" 2>/dev/null)
    PROD_BACKEND=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://swapsafe-backend.onrender.com/api/health" 2>/dev/null)
    
    if [ "$PROD_FRONTEND" = "200" ]; then
        echo -e "${GREEN}✅ Production Frontend${NC}"
    else
        echo -e "${RED}❌ Production Frontend (HTTP $PROD_FRONTEND)${NC}"
    fi
    
    if [ "$PROD_BACKEND" = "200" ]; then
        echo -e "${GREEN}✅ Production Backend${NC}"
    else
        echo -e "${YELLOW}⚠️  Production Backend (HTTP $PROD_BACKEND)${NC}"
        echo "   Note: Free Render tier may be sleeping"
    fi
fi
