# Deployment Checklist

See **[deployment.md](./deployment.md)** for full guide, env vars, and troubleshooting.

## Quick order: Neon → Render → Vercel → CORS

### 1) Neon
- [ ] Create project + database
- [ ] Copy **pooled** `DATABASE_URL` (with `?sslmode=require`)

### 2) Render (API)
- [ ] Web Service, Docker, `apps/api/Dockerfile`
- [ ] Health Check Path: `/health`
- [ ] Env: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- [ ] Env: `TRUST_PROXY=1`, `AUTH_COOKIE_SECURE=1`, `AUTH_COOKIE_SAMESITE=none`
- [ ] Env: `WEB_ORIGIN=https://YOUR_APP.vercel.app` (set after Vercel deploy)
- [ ] Deploy
- [ ] Run migrations: `pnpm -C apps/api db:deploy`
- [ ] Seed (optional): `pnpm -C apps/api db:seed`
- [ ] Verify: `GET /health` → 200, `GET /docs` loads

### 3) Vercel (Web)
- [ ] Import repo, root: `apps/web`
- [ ] Env: `NEXT_PUBLIC_API_BASE_URL=https://YOUR_API.onrender.com`
- [ ] Deploy

### 4) Wire CORS
- [ ] Set Render env `WEB_ORIGIN` to Vercel URL
- [ ] Redeploy API

### 5) Post-deploy verification
- [ ] Signup
- [ ] Login
- [ ] Refresh page → stay logged in (cookie works)
- [ ] Enroll in course
- [ ] Open lesson
- [ ] AI call (if enabled)
- [ ] Logout
