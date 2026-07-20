# ---- Build Stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace manifests for dependency install
COPY package.json yarn.lock ./
COPY apps/arena-api/package.json ./apps/arena-api/

# Install all dependencies (including devDependencies for build)
RUN yarn install --frozen-lockfile --production=false

# Copy source files needed for the build
COPY tsconfig.base.json ./
COPY libs/arena-shared ./libs/arena-shared/
COPY apps/arena-api ./apps/arena-api/

# Build the TypeScript
RUN cd apps/arena-api && npx tsc -p tsconfig.json

# ---- Production Stage ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy only production dependencies
COPY apps/arena-api/package.json ./
RUN yarn install --frozen-lockfile --production=true

# Copy compiled output
COPY --from=builder /app/apps/arena-api/dist ./dist

EXPOSE 2567

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:2567/api/health || exit 1

CMD ["node", "dist/index.js"]
