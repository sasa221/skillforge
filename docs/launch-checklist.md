## Launch checklist (pilot / serious demo)

### Environment setup verification
- **Node/pnpm** installed and versions match repo expectations.
- **Database** reachable (`DATABASE_URL` valid).
- **API** and **Web** can start locally without errors.

### Seed verification (demo readiness)
- Run seed and confirm:
  - at least one full course path exists (modules + lessons + at least one quiz)
  - lesson objectives and blocks look coherent
  - AI prompt seeds are present and helpful

### Demo accounts
- Admin: `admin@skillforge.dev` / `Admin123!`
- Student: `student@skillforge.dev` / `Student123!`

### Health endpoints
- API: `GET /health` → 200 `{ ok: true }`
- Swagger: `GET /docs` loads

### AI provider configuration
- `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` set in API environment
- Confirm AI teacher can:
  - load history
  - send message
  - fail gracefully (clear error + retry)

### Database readiness
- Migrations applied (production-style migrations in staging/prod).
- Postgres backups enabled (for managed DB).

### Start commands
```bash
docker compose up -d db
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm -C apps/api dev
pnpm -C apps/web dev
```

### Default local ports (this repo)
- Web: `http://localhost:3100`
- API: `http://localhost:3200` (Swagger at `/docs`, health at `/health`)

### Known MVP limitations (summary)
- Middleware route protection uses **hint cookies** for UX; backend remains the true authorization gate.
- Analytics is MVP-level (`AuditLog`) and not a full product analytics pipeline.
- Lesson blocks are JSON-edited in admin for MVP (not WYSIWYG).

