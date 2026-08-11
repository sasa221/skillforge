FROM node:20-alpine AS base
WORKDIR /app

# Root workspace files for pnpm
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy package.json files for all apps to ensure proper dependency resolution
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages packages

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Install all dependencies in the monorepo
RUN pnpm install --frozen-lockfile

# Copy api source code  
COPY apps/api apps/api

# Placeholder: full build with prisma will happen at runtime
RUN echo "Api ready for runtime build"

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy entire workspace and node_modules
COPY --from=base /app/node_modules /app/node_modules
COPY --from=base /app/apps/api /app/apps/api
COPY --from=base /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app/apps/api
EXPOSE 3200
# For now, the CMD will be overridden - containers need to be built locally first
CMD ["sh", "-c", "echo 'API container ready. Run: npm run build locally, docker build, then docker compose up'"]
