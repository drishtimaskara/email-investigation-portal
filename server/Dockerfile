# Stage 1: Build dependencies with build tools
FROM node:22-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci || npm install --omit=dev

# Stage 2: Minimal production runtime
FROM node:22-slim

WORKDIR /app

COPY --from=builder /app/server/node_modules ./server/node_modules
COPY server/ ./server/
COPY client/src/data/ ./client/src/data/
RUN mkdir -p /app/database

WORKDIR /app/server

ENV PORT=5001
ENV NODE_ENV=production

EXPOSE 5001

CMD ["node", "index.js"]
