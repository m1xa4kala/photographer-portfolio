# VPS Deployment: Photographer Portfolio

## Architecture

```
Browser ──:443──► Nginx (host) ──proxy──► backend:3000 (Docker) ──► PostgreSQL (Docker)
                 + Certbot SSL                              + uploads volume
```

All traffic goes through Nginx on the host, which terminates SSL via Let's Encrypt (Certbot) and proxies to the NestJS backend running in Docker. The backend serves the React SPA as static files and exposes `/api/*` and `/uploads/*`. Everything is same-origin — CORS is not a factor at runtime, but `FRONTEND_URL` in `.env` matches the domain.

## Files to create on VPS

| Path | Purpose |
|------|---------|
| `/home/<user>/photographer/.env` | Production environment variables |
| `/etc/nginx/sites-available/photographer` | Nginx reverse proxy config |
| `/etc/nginx/sites-enabled/photographer` (symlink) | Enable the site |

## Environment variables

`.env` on VPS:

- `NODE_ENV=production` — enables static SPA serving and skips dev checks
- `DB_PROD_*` — PostgreSQL prod credentials (Docker internal, port 5432)
- `JWT_SECRET` — generate with `openssl rand -base64 32`
- `FRONTEND_URL=https://domain.com` — used for CORS origin + required check
- `S3_*` — existing S3 credentials from current `.env`
- `PORT=3000` — backend listens on 3000, Nginx proxies to it

## Docker Compose

Uses existing `docker-compose.yml` with `--profile prod`. No Docker modifications needed.

## Nginx Config

- Listens on port 443 (SSL) with modern TLS settings
- Proxies everything to `http://localhost:3000`
- WebSocket support for potential future hot-reload features
- HTTP→301→HTTPS redirect on port 80

## SSL

- Certbot with `--nginx` plugin
- Auto-renewal via systemd timer (enabled by default)