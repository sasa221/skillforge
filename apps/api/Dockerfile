FROM node:20-alpine AS base
WORKDIR /app

# Root workspace files for pnpm
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
RUN pnpm install --frozen-lockfile=false --filter @skillforge/api...

COPY apps/api apps/api

WORKDIR /app/apps/api
RUN pnpm prisma generate
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app/apps/api
ENV NODE_ENV=production

COPY --from=base /app/apps/api/dist ./dist
COPY --from=base /app/apps/api/node_modules ./node_modules
COPY --from=base /app/node_modules /app/node_modules
COPY --from=base /app/apps/api/package.json ./package.json

EXPOSE 3200
CMD ["node", "dist/main.js"]
