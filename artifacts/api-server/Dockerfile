# syntax=docker/dockerfile:1

# Base node image
FROM node:22-alpine AS base
# Install pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Builder stage
FROM base AS builder
WORKDIR /app
# Copy the workspace root files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
# Copy the database library package.json
COPY lib/db/package.json ./lib/db/
# Copy the api server package.json
COPY artifacts/api-server/package.json ./artifacts/api-server/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY lib/db ./lib/db
COPY artifacts/api-server ./artifacts/api-server

# Build the project
WORKDIR /app/artifacts/api-server
RUN pnpm run build

# Production runtime stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressjs
USER expressjs

# Copy the built output from the builder stage
# The build script produces a single bundled file in dist/index.mjs
COPY --from=builder --chown=expressjs:nodejs /app/artifacts/api-server/dist ./dist

# Expose the listening port
EXPOSE 3001

# Add a healthcheck instruction
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/healthz || exit 1

# Start the application
CMD ["node", "dist/index.mjs"]
