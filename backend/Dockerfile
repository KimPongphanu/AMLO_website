# ============================================================
# Dockerfile - Backend (Express + Prisma + PostgreSQL client)
# ============================================================

# ---- Stage 1: Build ----
FROM node:20-alpine AS builder

# Install build dependencies for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client (use dummy DATABASE_URL for build-time config reading)
ENV DATABASE_URL=postgresql://dummy:dummy@dummy:5432/dummy
RUN npx prisma generate
RUN npm run build

# ---- Stage 2: Runner ----
FROM node:20-alpine AS runner

# Install PostgreSQL client (pg_dump, psql) for backup feature
RUN apk add --no-cache postgresql-client openssl

WORKDIR /app

# Copy built files and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma.config.ts ./

# Create backup directory
RUN mkdir -p /app/backups && chown -R node:node /app

# Switch to non-root user for security
USER node

EXPOSE 8080

# Run migration on startup, then start server
CMD npx prisma migrate deploy 2>/dev/null; node dist/server.js