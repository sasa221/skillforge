FROM node:20-alpine AS base
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy package.json files for all apps to ensure proper dependency resolution
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages packages

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Install all dependencies in the monorepo
RUN pnpm install --frozen-lockfile=false

# Copy web source code
COPY apps/web apps/web

ENV NODE_ENV=production
# Placeholder: Next.js build will happen at runtime  
RUN echo "Web ready for runtime build"

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy entire workspace and node_modules
COPY --from=base /app/node_modules /app/node_modules
COPY --from=base /app/apps/web /app/apps/web
COPY --from=base /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app/apps/web
EXPOSE 3100
# For now, the CMD will be overridden - containers need to be built locally first
CMD ["sh", "-c", "echo 'Web container ready. Run: npm run build locally, docker build, then docker compose up'"]
