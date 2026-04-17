# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SwapSafe Marketplace is a full-stack e-commerce platform for used items with AI-powered photo enhancement. The application combines a React frontend with Express/MongoDB backend and a Python FastAPI AI engine for computer vision tasks.

**Architecture:** Frontend → Backend → AI Engine (via tunnel)
**Key URLs:** Production (Vercel + Render), Local dev at http://localhost:3000

## Common Commands

### Frontend Development
```bash
npm run dev          # Start Vite dev server at http://localhost:3000
npm run build        # Production build (outputs to dist/)
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
```

### Backend Development
```bash
cd server
node index.js        # Start Express backend at http://localhost:5000
```

### AI Engine (Python)
```bash
cd ai-engine
python main.py       # Start FastAPI server (default: http://localhost:8001)
./start_production.sh  # Production startup script

# Install/update dependencies
pip install -r requirements.txt
```

### Deployment
```bash
npm run deploy       # Deploy to GitHub Pages (gh-pages)
```

## Architecture & Code Organization

### Three-Tier Architecture

**1. Frontend (React + Vite)**
- `src/App.jsx` - Main entry, theme state, routing, provider hierarchy
- `src/pages/` - Route components (Landing, Browse, QuickSell, ProductDetail, etc.)
- `src/components/` - Reusable components organized by type
  - `layout/` - Header, Footer, BackgroundManager, theme backgrounds
  - `common/` - Shared components (ProductCard, ErrorBoundary, Toast, etc.)
  - `sell/` - QuickSell and listing-related components
- `src/services/api.js` - Centralized API client with 8s timeout and auth token handling
- `src/context/` - React Context providers (Auth, Cart, Wishlist, Toast)

**2. Backend (Express + MongoDB)**
- `server/index.js` - Express app entry point
- `server/models/` - Mongoose schemas (Listing, User, etc.)
- `server/routes/` - API route handlers (`ai.js` for AI endpoints)
- `server/middleware/` - Auth middleware (JWT protection)
- `server/services/` - Business logic (AI service integration, job queue)

**3. AI Engine (FastAPI + Python)**
- `ai-engine/main.py` - FastAPI entry, CORS, router registration
- `ai-engine/app/routers/` - API endpoints (`studio.py` for image enhancement, `brain.py` for reasoning)
- `ai-engine/app/services/` - AI/ML services (vision models, background removal, enhancement)
- Exposed via Cloudflare Tunnel for production (URL changes on restart - update `AI_ENGINE_URL` in backend env)

### Theme System

The application uses a sophisticated theme system with 6 animated canvas backgrounds:

**Themes:** classic → esoteric → mystical → void → minimal → psychedelic (cyclic)

**Implementation:**
- `BackgroundManager.jsx` switches between theme-specific canvas components
- Theme state stored in `localStorage` with key `'theme'`
- `App.jsx` applies `theme-{name}` class to document.body
- `src/styles/index.css` defines theme-specific CSS variables and animations
- Each theme has its own background component in `src/components/layout/`:
  - `SpiralBackground.jsx` (classic) - Sacred geometry
  - `EsotericBackground.jsx` (esoteric) - Om + Sri Yantra + Lotus petals (Hindu)
  - `MysticalBackground.jsx` (mystical) - Stars, nebula, aurora
  - `VoidBackground.jsx` (void) - Electric pulses, black void
  - `MinimalBackground.jsx` (minimal) - Grid, floating dots
  - `PsychedelicBackground.jsx` (psychedelic) - Fine rings + golden spiral (Fibonacci)

**Theme Toggle:** Header component receives `currentTheme` and `toggleTheme` props, displays dynamic icon based on active theme.

### AI Integration

**Distributed Cognitive System** (See `AI_STRATEGY.md`):
- Layer C (Server): Cloud LLM for reasoning/planning (Gemini 1.5 Flash / GPT-4)
- Layer B (Network): JSON-only payload, no binary image data crosses boundary
- Layer A (Client): Local pixel rendering (SDXL Turbo, rembg)

**Backend AI Routes** (`server/routes/ai.js`):
- `GET /api/ai/status` - Check AI providers, active provider config
- `POST /api/ai/estimate-price` - AI price estimation for listings
- `POST /api/ai/enhance-photo` - Background removal via AI engine
- Provider abstraction: Supports Groq, OpenAI, Ollama (local LLM), Gemini (vision)

**Environment Variables:**
- Frontend: `VITE_API_URL` (backend URL)
- Backend: `MONGODB_URI`, `JWT_SECRET`, `AI_ENGINE_URL`, `AI_PROVIDER`, `VISION_PROVIDER`
- AI Engine: Credentials loaded from `../ai-lab/.env` then local `.env`

### State Management

- **Auth Context:** JWT token in localStorage (`swapsafe_token`), user object
- **Cart Context:** Cart items array, add/remove operations
- **Wishlist Context:** Saved items for later
- **Toast Context:** Notification system with auto-dismiss
- **Theme:** Managed in App.jsx state, persisted to localStorage

### Key Design Patterns

**Component Organization:**
- Canvas background components are standalone with mobile fallbacks (gradient divs)
- Framer Motion for animations (page transitions, modals, gestures)
- Lucide React for consistent iconography
- CSS Variables + Tailwind for styling (see `tailwind.config.js`)

**Error Handling:**
- `ErrorBoundary` wraps entire app
- API requests use AbortController with 8s timeout
- Console logging in api.js for debugging (fetch attempts, URLs, responses)

**Performance Considerations:**
- Canvas animations disabled on mobile (<768px)
- Animation frame cleanup in useEffect returns
- RequestAnimationFrame references stored in refs for proper cancellation

## Working with This Codebase

### Adding a New Theme
1. Create canvas component in `src/components/layout/{ThemeName}Background.jsx`
2. Add mobile fallback (gradient div with CSS animation)
3. Add theme to `BackgroundManager.jsx` switch statement
4. Add theme name to theme cycle in `App.jsx`
5. Define CSS variables in `src/styles/index.css` (`body.theme-{name}`)
6. Add animation keyframes if needed (mobile fallback)
7. Update `ThemeIndicator.jsx` with theme name and color

### Modifying AI Features
- Backend AI routes in `server/routes/ai.js`
- AI engine services in `ai-engine/app/services/`
- FastAPI routers in `ai-engine/app/routers/`
- Update `AI_ENGINE_URL` in backend env when tunnel restarts

### Adding New Pages
1. Create component in `src/pages/{PageName}.jsx`
2. Add route in `src/App.jsx` Routes component
3. Add navigation link in `Header.jsx` if needed
4. Create CSS module file if page-specific styles needed

### Important Gotchas
- AI engine Cloudflare Tunnel URL changes on restart - must update `AI_ENGINE_URL` in Render backend environment
- Canvas backgrounds must handle mobile gracefully (isMobile state + fallback divs)
- Theme class must be applied to `document.body` for CSS variable resolution
- API client has 8-second timeout - long-running AI operations may need job queue pattern
- Always cleanup animation frames in useEffect returns to prevent memory leaks
