FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies across all workspaces
COPY package.json package-lock.json ./
COPY core/package.json ./core/
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client (run from server/ so Prisma finds prisma.config.ts)
RUN cd server && ../node_modules/.bin/prisma generate

# Build the Vite SPA
RUN npm run build --workspace=client

# ---- runtime image ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/core ./core
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Run migrations (from server/ so Prisma finds prisma.config.ts), then start the server
CMD ["sh", "-c", "(cd server && ../node_modules/.bin/prisma migrate deploy) && node_modules/.bin/tsx server/src/index.ts"]
