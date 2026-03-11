# SkillForge Deployment Guide

Neon (PostgreSQL) → Render (API) → Vercel (Web)

**Critical**: Web (Vercel) and API (Render) are on different domains. The refresh-token cookie must use `SameSite=None` and `Secure=1`, or the browser will not send it on cross-site requests.

---

## 1. Deployment Order

| Step | Service | Action |
|------|---------|--------|
| 1 | Neon | Create database, get `DATABASE_URL` |
| 2 | Render | Deploy API (Docker), run migrations |
| 3 | Vercel | Deploy Web, point to API URL |
| 4 | Render | Set `WEB_ORIGINS` to Vercel URL (CORS) |

Deploy in this order: DB → API → Web. Then wire CORS from API to Web.

---

## 2. Exact Environment Variables

### Neon (PostgreSQL)

No env vars to configure in Neon UI. You only need the connection string:

- **Pooled connection** (recommended for serverless/Render): Copy from Neon dashboard → Connection Details → **Pooled connection**
- Format: `postgresql://user:password@host/dbname?sslmode=require`

---

### Render (API)

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | Neon pooled URL (with `?sslmode=require`) | Yes |
| `API_PORT` | `3200` | Yes |
| `WEB_ORIGIN` | `https://YOUR_APP.vercel.app` | Yes (or use `WEB_ORIGINS`) |
| `WEB_ORIGINS` | `https://YOUR_APP.vercel.app` (comma-separated if multiple) | Alternative to `WEB_ORIGIN` |
| `JWT_ACCESS_SECRET` | Random string ≥32 chars | Yes |
| `JWT_REFRESH_SECRET` | Random string ≥32 chars (different from access) | Yes |
| `TRUST_PROXY` | `1` | Yes (Render uses reverse proxy) |
| `AUTH_COOKIE_SECURE` | `1` | Yes (HTTPS only) |
| `AUTH_COOKIE_SAMESITE` | `none` | Yes (cross-site: Vercel ≠ Render) |
| `AUTH_COOKIE_DOMAIN` | Leave **empty** | No |
| `AI_BASE_URL` | e.g. `https://api.openai.com/v1` | If using AI |
| `AI_API_KEY` | Your OpenAI / compatible API key | If using AI |
| `AI_MODEL` | e.g. `gpt-4o-mini` | If using AI |
| `AI_MAX_OUTPUT_TOKENS` | e.g. `800` | Optional, cost control |

**Important**: Use `AUTH_COOKIE_SAMESITE=none` only with `AUTH_COOKIE_SECURE=1`. Both are required for cross-site cookies.

---

### Vercel (Web)

| Variable | Value | Required |
|----------|-------|----------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://YOUR_API.onrender.com` | Yes |

No trailing slash. Must be HTTPS in production.

---

## 3. Render Setup

### Create Web Service

1. **New** → **Web Service**
2. Connect repo, select branch
3. **Root Directory**: leave empty (repo root)
4. **Runtime**: Docker
5. **Dockerfile Path**: `apps/api/Dockerfile`
6. **Instance Type**: Free (or paid for faster cold starts)
7. **Health Check Path**: `/health`

### Environment

Add all API env vars in Render **Environment** tab. Use **Secret** for `DATABASE_URL`, `JWT_*`, `AI_API_KEY`.

### After First Deploy

Run migrations once:

- **Render Dashboard** → your service → **Shell** (or one-off job)
- Or from local with Neon URL:
  ```bash
  DATABASE_URL="postgresql://..." pnpm -C apps/api db:deploy
  ```

### Seed (Optional)

For demo content and roles:

```bash
DATABASE_URL="postgresql://..." pnpm -C apps/api db:seed
```

---

## 4. Vercel Setup

1. **Add New** → **Project** → Import repo
2. **Root Directory**: `apps/web`
3. **Framework**: Next.js (auto-detected)
4. **Environment Variables**:
   - `NEXT_PUBLIC_API_BASE_URL` = `https://YOUR_API.onrender.com`

Deploy. After deploy, copy the Vercel URL (e.g. `https://skillforge-xxx.vercel.app`).

---

## 5. Wire CORS (API → Web)

Go back to Render API env vars:

- Set `WEB_ORIGIN` (or `WEB_ORIGINS`) = `https://YOUR_APP.vercel.app`
- Redeploy API so CORS allows the Vercel origin

---

## 6. Code/Config to Double-Check Before Deploy

| Item | Location | Check |
|------|----------|-------|
| API health path | `apps/api/src/modules/health` | `GET /health` returns `{ ok: true }` |
| Cookie name | `apps/api/src/modules/auth/auth.constants.ts` | `sf_refresh` |
| Cookie path | `auth.controller.ts` | `path: '/auth'` (matches refresh endpoint) |
| Credentials | `apps/web/src/lib/api/client.ts` | `credentials: 'include'` on all fetch |
| API base URL | Web env | `NEXT_PUBLIC_API_BASE_URL` used by client |
| Dockerfile CMD | `apps/api/Dockerfile` | `node dist/main.js` (matches Nest build output) |

---

## 7. Post-Deploy Verification Checklist

| # | Action | Expected |
|---|--------|----------|
| 1 | **Signup** – create account at `/signup` | No error, redirected to dashboard |
| 2 | **Login** – sign out and log in at `/login` | Session restored |
| 3 | **Refresh persistence** – refresh page on `/dashboard` | Stay logged in (cookie sent, token refreshed) |
| 4 | **Enroll** – enroll in a course | Enrollment succeeds |
| 5 | **Lesson open** – open a lesson | Content loads |
| 6 | **AI call** – use AI chat (if enabled) | Response returns |
| 7 | **Logout** – click logout | Cookie cleared, redirected to login |

### Quick API Checks

```bash
# Health
curl -s https://YOUR_API.onrender.com/health
# Expect: {"ok":true}

# Docs
open https://YOUR_API.onrender.com/docs
```

---

## 8. Troubleshooting

### Logged out after refresh

**Cause**: Refresh cookie not sent on page reload (cross-site cookie blocked).

**Fix**:
- API: `AUTH_COOKIE_SAMESITE=none` and `AUTH_COOKIE_SECURE=1`
- Both Web and API must use HTTPS
- `WEB_ORIGIN` / `WEB_ORIGINS` must include the exact Vercel URL (no trailing slash, correct protocol)

---

### CORS failure

**Symptom**: Browser console shows CORS error when calling API.

**Fix**:
- API: `WEB_ORIGIN` or `WEB_ORIGINS` must include the exact origin (e.g. `https://skillforge.vercel.app`)
- No trailing slash, correct protocol (https)
- Redeploy API after changing env vars

---

### Cookie not sent

**Cause**: Browser blocks third-party cookies or cookie attributes wrong.

**Fix**:
- `AUTH_COOKIE_SAMESITE=none` and `AUTH_COOKIE_SECURE=1` for cross-site
- Web: `credentials: 'include'` on all API fetch (already in client)
- Verify API `Set-Cookie` response header (DevTools → Network → auth/login → Response Headers)

---

### API unreachable

**Symptom**: Network error, timeout, 502/503.

**Fix**:
- Render free tier: service sleeps after ~15 min idle; first request may take 30–60s
- Check Render logs for crashes
- Verify `DATABASE_URL` (Neon) is correct and includes `?sslmode=require`
- Health check: `GET /health` should return 200

---

### Migration issues

**Symptom**: API fails with Prisma/migration errors.

**Fix**:
- Run migrations against Neon: `DATABASE_URL="postgresql://..." pnpm -C apps/api db:deploy`
- Do not run `db:migrate dev` in production; use `db:deploy`
- Ensure Prisma schema matches migrations in repo

---

### Signup / login returns 500

**Fix**:
- Check Render logs for stack trace
- Ensure `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are set
- Ensure seed ran (roles exist): `pnpm -C apps/api db:seed`
- Verify Neon DB is reachable

---

### Custom domains (optional)

If you use `app.example.com` (Web) and `api.example.com` (API):

- `WEB_ORIGINS` = `https://app.example.com`
- `AUTH_COOKIE_SAMESITE` = `lax` (same-site)
- `AUTH_COOKIE_SECURE` = `1`
- `NEXT_PUBLIC_API_BASE_URL` = `https://api.example.com`

---

## Summary: Minimal Production Env (Render + Vercel)

**Render (API)**  
`DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `TRUST_PROXY=1`, `AUTH_COOKIE_SECURE=1`, `AUTH_COOKIE_SAMESITE=none`, `WEB_ORIGIN=https://YOUR_APP.vercel.app`

**Vercel (Web)**  
`NEXT_PUBLIC_API_BASE_URL=https://YOUR_API.onrender.com`
