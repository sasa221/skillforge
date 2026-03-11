## SkillForge (MVP)

AI-powered interactive learning platform (Next.js + NestJS + PostgreSQL + Prisma).

### Repo structure (monorepo)

- `apps/web`: Next.js (App Router) frontend
- `apps/api`: NestJS backend + Prisma schema/migrations/seed
- `packages/*`: reserved for shared code (types/ui/utils) as we evolve
- `docs`: architecture notes + ADRs

### Prerequisites

- Node.js 20+ (or 22+)
- pnpm 9+
- Docker Desktop (for PostgreSQL)

### Quickstart (local dev)

1) Create `.env` from `.env.example`

2) Start PostgreSQL

```bash
docker compose up -d db
```

3) Install dependencies

```bash
pnpm install
```

4) Run migrations + seed

```bash
pnpm db:migrate
pnpm db:seed
```

5) Start apps

```bash
pnpm -C apps/api dev
pnpm -C apps/web dev
```

### Default dev users (seed)

- Admin: `admin@skillforge.dev` / `Admin123!`
- Student: `student@skillforge.dev` / `Student123!`

### Environment variables

#### Web (`apps/web`)

- **`NEXT_PUBLIC_API_BASE_URL`**: base URL of the API (dev: `http://localhost:3200`)
- **`WEB_PORT`**: web port (dev default `3100` when using repo `.env`)

#### API (`apps/api`)

- **`DATABASE_URL`**: Postgres connection string
- **`WEB_ORIGIN`**: web origin allowed for CORS (dev: `http://localhost:3100`)
- **`WEB_ORIGINS`**: optional comma-separated allowlist for multiple origins (e.g. Vercel preview + production)
- **`API_PORT`**: API port (dev default `3200`)
- **`JWT_ACCESS_SECRET`**, **`JWT_REFRESH_SECRET`**: strong secrets
- **`JWT_ACCESS_TTL_SECONDS`**: default 900
- **`JWT_REFRESH_TTL_SECONDS`**: default 2592000 (30d)
- **`AI_BASE_URL`**, **`AI_API_KEY`**: OpenAI-compatible provider config
- **`AI_MODEL`**: provider model id/name
- **`AI_MAX_OUTPUT_TOKENS`**: default 800
- **`TRUST_PROXY`**: set `1` on managed hosting behind a proxy (Render/Railway/etc)
- **`AUTH_COOKIE_SECURE`**: set `1` for HTTPS deployments
- **`AUTH_COOKIE_SAMESITE`**: `lax` (same-site subdomains) or `none` (cross-site domains; requires Secure)
- **`AUTH_COOKIE_DOMAIN`**: optional cookie domain (usually leave empty unless you use a custom domain strategy)

### Useful commands

- `pnpm db:up`: start database
- `pnpm db:migrate`: prisma migrate dev
- `pnpm db:seed`: seed sample content
- `pnpm -r lint`: lint all workspaces
- `pnpm -r build`: build all workspaces

### Docs

- QA checklist: `docs/qa-checklist.md`
- Deployment notes: `docs/deployment.md`
