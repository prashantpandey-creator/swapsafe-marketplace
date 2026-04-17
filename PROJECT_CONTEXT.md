# SwapSafe Marketplace - Project Context

> **Purpose:** This file maintains complete project context across all development sessions. Read this first when resuming work.

---

## Quick Reference

| Item | Value |
|------|-------|
| **Project Name** | SwapSafe Marketplace |
| **Type** | P2P Marketplace with AI-powered listing creation |
| **Status** | Active Development |
| **Primary Tech** | React (Vite) + Node.js + MongoDB + Python AI Engine |
| **Current Phase** | QuickSell Feature Complete, Testing Authentication Flow |

---

## Architecture Overview

```
marketplace/
├── src/                    # React frontend (Vite)
├── server/                 # Node.js backend (Express + MongoDB)
├── ai-engine/             # Python FastAPI (Gemini + Groq + BiRefNet)
└── PROJECT_CONTEXT.md     # This file
```

### Tech Stack

**Frontend:**
- React 18 + Vite
- Tailwind CSS + Custom CSS Variables
- React Router v6
- Framer Motion (animations)
- Lucide React (icons)

**Backend:**
- Node.js + Express
- MongoDB Atlas (Mongoose ODM)
- JWT Authentication
- Cloudinary (image storage)

**AI Engine:**
- Python 3.10 + FastAPI
- Google Gemini Vision (product analysis)
- Groq Llama (price extraction, fallback analysis)
- BiRefNet (background removal)
- DuckDuckGo (market research)

---

## Key Features

### ✅ Completed Features

1. **QuickSell Flow**
   - Camera/gallery image selection
   - AI auto-detect (Gemini Vision → Groq fallback)
   - Smart price estimation using market data
   - Stock image suggestion
   - Multi-image gallery with enhancement
   - Background removal (Fast/Pro modes)

2. **AI Services**
   - Product analysis from photos
   - Condition assessment
   - Price estimation with market research
   - Stock image fetching

3. **Visual Identity**
   - "Buyers Legion" theme
   - Cinzel + Manrope typography
   - Gold accent color (#FBB324)
   - Guardian "Guruji" branding elements

### 🚧 In Progress

- User authentication flow testing
- Listing submission verification

### 📋 Planned

- 3D product previews
- Real-time chat
- Legion Shield (trust scoring)
- Payment integration

---

## Environment Setup

### Required Services

1. **MongoDB Atlas** - Database (configured in `server/.env`)
2. **Cloudinary** - Image hosting (configured in `server/.env`)
3. **Groq API** - AI fallback (free tier, key in `ai-engine/.env`)
4. **Gemini API** - Vision analysis (optional, can use Groq)

### Running Locally

```bash
# Terminal 1: Frontend (port 3000)
npm run dev -- --host

# Terminal 2: Backend (port 5000)
cd server && npm run dev

# Terminal 3: AI Engine (port 8001)
cd ai-engine && ./start_engine.sh
```

**Health Checks:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000/api/health
- AI Engine: http://localhost:8001/health

---

## Important Decisions & Conventions

### Naming Conventions

- **Components:** PascalCase (`QuickSellDetails.jsx`)
- **Services:** camelCase (`listing_generator.py`)
- **Routes:** kebab-case (`/api/ai/refine-listing`)

### Code Organization

**Frontend:**
- `/src/pages/` - Full pages
- `/src/components/` - Reusable components
- `/src/services/` - API clients
- `/src/context/` - React contexts (Auth, Toast, etc.)

**Backend:**
- `/server/routes/` - API endpoints
- `/server/models/` - Mongoose schemas
- `/server/middleware/` - Auth, validation, etc.

**AI Engine:**
- `/ai-engine/app/agents/` - Multi-agent system
- `/ai-engine/app/services/` - AI pipelines
- `/ai-engine/app/routers/` - FastAPI routes

### Design Patterns

1. **Multi-Agent AI Architecture**
   - `VisualAnalysisAgent` - Analyzes product photos
   - `MarketIntelligenceAgent` - Price research
   - `ListingGenerator` - Supervisor agent

2. **Graceful Degradation**
   - Gemini → Groq fallback for vision
   - DuckDuckGo → Regex fallback for prices
   - Always show progress, never silent failures

3. **Defensive Programming**
   - Optional chaining (`?.`) for all nested objects
   - Type checks before rendering (`typeof price === 'number'`)
   - Default values for display properties

---

## Known Issues & Limitations

### Current Bugs

- [ ] User must be logged in to post listings (authentication required)
- [x] ~~Price estimate rendering as object~~ (Fixed 2026-02-13)
- [x] ~~React crash on null analysis result~~ (Fixed 2026-02-13)

### Technical Debt

- Camera capture needs better mobile UX
- Image upload could use progress indicators
- Stock image quality varies

### API Rate Limits

- **Groq:** 30 requests/minute (free tier)
- **Gemini:** 60 requests/minute (free tier)
- **DuckDuckGo:** No official limit, but rate-limited

---

## Recent Changes (Last 7 Days)

**2026-02-13:**
- Fixed price estimation returning object instead of number
- Added defensive programming patterns to CLAUDE.md
- Audited listing submission flow
- Implemented Groq fallback for price extraction

**2026-02-12:**
- Fixed stock image flow (manual trigger instead of auto)
- Groq vision integration completed
- Server management UI added

**2026-02-11:**
- QuickSell UI complete redesign
- Multi-agent architecture implemented
- Visual identity (Buyers Legion) integrated

---

## Testing Checklist

Before considering a feature complete:

- [ ] Test on Chrome desktop
- [ ] Test on mobile (Safari/Chrome)
- [ ] Check browser console for errors
- [ ] Verify Network tab shows 200 responses
- [ ] Test error states (no internet, API failure)
- [ ] Hard refresh (`Cmd+Shift+R`) to verify hot reload

---

## Troubleshooting Guide

### Common Issues

**"Cannot POST listing"**
→ Check if logged in: `localStorage.getItem('swapsafe_token')`

**"AI Engine not responding"**
→ Check health: `curl http://localhost:8001/health`

**"Price shows NaN or undefined"**
→ Check backend returns number, not object

**"Images not uploading"**
→ Verify Cloudinary credentials in `server/.env`

---

## Contact & Resources

- **Artifacts:** `/Users/badenath/.gemini/antigravity/brain/6cc5b950-070d-4a89-8aa4-1aff1fcf9b2f/`
- **Knowledge Base:** `/Users/badenath/CLAUDE.md`
- **Logs:** See artifacts `.system_generated/logs/`

---

**Last Updated:** 2026-02-13
**Status:** Active Development - QuickSell Complete, Authentication Testing
