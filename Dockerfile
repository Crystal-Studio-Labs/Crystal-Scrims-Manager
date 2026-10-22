# Multi-stage lightweight production build for Bot + Dashboard SPA
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Build Backend
COPY package*.json ./
RUN npm ci
COPY tsconfig.json drizzle.config.ts ./
COPY src/ ./src/
RUN npm run build

# 2. Build Dashboard Frontend
WORKDIR /app/dashboard
COPY dashboard/package*.json ./
RUN npm ci
COPY dashboard/ ./
RUN npm run build

# 3. Production Runtime Stage (Ultra-lean)
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package*.json ./
RUN npm ci --omit=dev

# Copy backend compiled output
COPY --from=builder /app/dist ./dist

# Copy dashboard compiled frontend
COPY --from=builder /app/dashboard/dist ./dashboard/dist

# SQLite persistence volume mount
VOLUME ["/app/data"]

EXPOSE 8080

CMD ["node", "dist/index.js"]
