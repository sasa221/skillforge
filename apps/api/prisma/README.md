## Prisma

- Schema: `prisma/schema.prisma`
- Seed: `prisma/seed.ts`

### Typical workflow (local)

```bash
pnpm -C apps/api prisma generate
pnpm -C apps/api prisma migrate dev
pnpm -C apps/api prisma db seed
```

