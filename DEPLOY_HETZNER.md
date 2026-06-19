# SwapSafe — Hetzner Deployment (alongside PuranGPT)

Server: `204.168.176.229` (same VPS as PuranGPT)

## Port Map (both projects)

| Service              | Port |
|----------------------|------|
| PuranGPT frontend    | 3000 |
| PuranGPT backend     | 8000 |
| **SwapSafe frontend**| **3001** |
| **SwapSafe backend** | **5000** |
| **SwapSafe AI engine**| **8001** |
| MongoDB              | 27017 |
| Redis                | 6379 |

## First-Time Setup

### 1. SSH into Hetzner

```bash
ssh -i ~/.ssh/purangpt_hetzner root@204.168.176.229
```

### 2. Clone the repo

```bash
cd /root
git clone https://github.com/prashantpandey-creator/swapsafe-marketplace.git
cd swapsafe-marketplace
```

### 3. Create env files

Copy the templates and fill in your real keys:

```bash
cp server/.env.hetzner server/.env
cp ai-engine/.env.hetzner ai-engine/.env
```

Edit `server/.env` — at minimum set:
- `JWT_SECRET` (any random string)
- `GROQ_API_KEY` (copy from PuranGPT's .env)
- `GEMINI_API_KEY` (copy from PuranGPT's .env)

```bash
# Grab keys from PuranGPT
grep GROQ_API_KEY /root/purangpt/.env
grep GEMINI_API_KEY /root/purangpt/.env

# Paste into SwapSafe envs
nano server/.env
nano ai-engine/.env
```

### 4. Build and launch

```bash
docker compose build
docker compose up -d
```

### 5. Verify

```bash
# Check all containers are running
docker compose ps

# Check logs
docker compose logs backend --tail 20
docker compose logs ai-engine --tail 20
docker compose logs frontend --tail 20

# Test endpoints
curl http://localhost:5000/api/health
curl http://localhost:8001/docs
curl http://localhost:3001
```

SwapSafe is now live at `http://204.168.176.229:3001`

## Auto-Deploy (GitHub Actions)

Add your SSH key as a GitHub secret:

1. Go to repo → Settings → Secrets → Actions
2. Add `VPS_SSH_KEY` with the same private key used for PuranGPT

Pushes to `main` that touch server/frontend/ai-engine code will auto-deploy.

## Common Commands

```bash
cd /root/swapsafe-marketplace

# Restart everything
docker compose restart

# Rebuild after code changes
docker compose build --no-cache && docker compose up -d

# View logs
docker compose logs -f backend
docker compose logs -f ai-engine

# Seed database with demo products
docker compose exec backend node seed.js

# Stop everything
docker compose down

# Stop and wipe data (MongoDB + Redis)
docker compose down -v
```
