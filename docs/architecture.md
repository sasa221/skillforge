## Architecture (MVP)

### High-level

- **Web** (`apps/web`): Next.js App Router, Tailwind, shadcn-ready component layer, typed forms (RHF + Zod), React Query for server state, Zustand for local app state.
- **API** (`apps/api`): NestJS modules with DTO validation, Swagger docs, Prisma for database access, JWT auth (Phase 2), modular AI integration (Phase 5).
- **DB**: PostgreSQL with Prisma schema designed for content, progress, gamification, AI sessions, and audit logging.

### Data boundaries

- The API owns the domain models and validation.
- The web app consumes the API via typed client helpers (later: shared `packages/types` generated from OpenAPI).

### Environments

- Local dev uses `docker-compose.yml` for Postgres. Apps run locally or inside compose.

