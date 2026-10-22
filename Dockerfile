# Multi-stage lightweight production build
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Production runtime stage (ultra-lean)
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Create volume mount point for local sqlite database persistence if used
VOLUME ["/app/data"]

EXPOSE 8080

CMD ["node", "dist/index.js"]
