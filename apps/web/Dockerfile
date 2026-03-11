FROM node:20-alpine AS base
WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
RUN pnpm install --frozen-lockfile=false --filter @skillforge/web...

COPY apps/web apps/web

WORKDIR /app/apps/web
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app/apps/web
ENV NODE_ENV=production

COPY --from=base /app/apps/web/.next ./.next
COPY --from=base /app/apps/web/public ./public
COPY --from=base /app/apps/web/node_modules ./node_modules
COPY --from=base /app/node_modules /app/node_modules
COPY --from=base /app/apps/web/package.json ./package.json

EXPOSE 3100
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3100"]
