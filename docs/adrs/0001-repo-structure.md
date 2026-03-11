## ADR 0001: Monorepo structure

### Decision

Use a monorepo with:

- `apps/web` (Next.js)
- `apps/api` (NestJS)
- `packages/*` reserved for shared code

### Why

- Shared tooling + consistent scripts.
- Clear separation of concerns between web and api.
- Easy to add shared types/UI utilities later without circular dependencies.

### Consequences

- Requires workspace tooling (pnpm recommended).
- Docker build contexts must copy workspace manifests (handled via app Dockerfiles).

