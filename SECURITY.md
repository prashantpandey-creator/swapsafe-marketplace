# Security Notes — SwapSafe Deployment

## Incident: exposed MongoDB ransomed (2026-06)

An earlier version of `docker-compose.yml` published MongoDB (`27017`) and Redis
(`6379`) on `0.0.0.0` with **no authentication**. Within hours of deployment, an
automated ransom bot found the open MongoDB, dropped the `swapsafe` database, and
left a `READ_ME_TO_RECOVER_YOUR_DATA` note demanding BTC.

This is the well-known mass MongoDB ransom campaign: the bots **do not actually
back up** the data — they only run `dropDatabase`. Paying returns nothing. The
ransom was **not paid**; the database was rebuilt from scratch.

## Hardening (current configuration)

- **Only the frontend (port 3010) is published to the public internet.**
- **MongoDB, Redis, backend, and ai-engine bind to `127.0.0.1` only.** They
  communicate over the internal Docker network; nothing else is reachable from
  outside the host.
- **MongoDB runs with root authentication** (`MONGO_INITDB_ROOT_USERNAME` /
  `MONGO_INITDB_ROOT_PASSWORD`). The backend connects with
  `?authSource=admin`.
- **Redis requires a password** (`--requirepass` / `REDIS_PASSWORD`).
- Port **3001** is intentionally avoided — it belongs to a co-hosted project
  (PuranGPT Logto) on the same VPS. SwapSafe uses **3010**.

## Rules going forward

1. **Never bind a database/cache to `0.0.0.0`.** If a service must be reachable
   off-box, put it behind the reverse proxy with TLS + auth — never raw.
2. **Never run a datastore without auth**, even "temporarily."
3. Secrets live in `.env` files that are **gitignored** (`.env`, `**/.env`).
   Only `*.env.hetzner` templates (with `CHANGE_ME` placeholders) are committed.
4. Rotate any credential that was ever exposed on a public host (the shared
   GROQ/GEMINI keys reused from PuranGPT should be rotated).
5. Confirm exposure after every deploy:
   ```bash
   for p in 3010 5000 8001 27017 6379; do nc -z -w3 204.168.176.229 $p \
     && echo "$p OPEN" || echo "$p closed"; done
   # Expected: 3010 OPEN, all others closed.
   ```
