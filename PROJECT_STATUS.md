# SwapSafe Marketplace - Project Status

> Last Updated: 2026-02-02
> Version: 1.0.0-beta

## Quick Status Dashboard

| Area | Status | Health |
|------|--------|--------|
| Frontend (Vercel) | 🟢 Deployed | Good |
| Backend (Render) | 🟡 Needs Config | Needs AI_ENGINE_URL |
| AI Engine (Local) | 🟢 Running | Good |
| Cloudflare Tunnel | 🟡 Temporary URL | Changes on restart |
| Database (MongoDB) | 🟢 Connected | Good |

---

## Deployment URLs

| Environment | URL |
|-------------|-----|
| Production Frontend | https://swapsafe-marketplace.vercel.app |
| Production Backend | https://swapsafe-backend.onrender.com |
| AI Engine Tunnel | https://focusing-combining-accessing-professional.trycloudflare.com |
| GitHub Repo | https://github.com/prashantpandey-creator/swapsafe-marketplace |

---

## Recent Changes (Last 7 Days)

### 2026-02-02
- Added development tracking framework
- Created PROJECT_STATUS.md, BUGS.md

### 2026-02-01
- Added guest login feature
- Set up Cloudflare tunnel for AI engine
- Routed AI calls through backend
- Fixed camera functionality
- Added "Create Pro Photo" feature

### 2026-01-31
- Implemented AI engine with rembg
- Added background removal
- Created StudioMode for 3D

---

## Tech Stack

### Frontend
- React 18 + Vite
- React Router v6
- Framer Motion (animations)
- Lucide React (icons)
- CSS Variables (theming)

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Multer (file uploads)

### AI Engine
- Python + FastAPI
- rembg (background removal)
- Cloudflare Tunnel (exposure)

---

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=https://swapsafe-backend.onrender.com/api
```

### Backend (Render)
```
MONGODB_URI=<mongodb-connection-string>
JWT_SECRET=<jwt-secret>
AI_ENGINE_URL=<cloudflare-tunnel-url>  # ⚠️ Update when tunnel restarts
```

---

## Known Issues

See [BUGS.md](./BUGS.md) for full list.

---

## Upcoming Features

See [FEATURES.md](./FEATURES.md) for roadmap.
