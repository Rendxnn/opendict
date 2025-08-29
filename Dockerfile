# Multi-stage Dockerfile for Next.js (SSR) on Cloud Run

# 1) Builder: install deps and build
FROM node:20-alpine AS builder
ENV NODE_ENV=development \
    NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# Install OS deps (optional: sharp needs libc6-compat on alpine)
RUN apk add --no-cache libc6-compat

# Only copy package files for faster install caching
COPY package.json package-lock.json* ./

# Install all deps (dev + prod) to build
RUN npm install

# Copy the rest of the source
COPY . .

# Build Next.js (standalone output configured in next.config.ts)
RUN npm run build


# 2) Runner: minimal image with standalone server
FROM node:20-alpine AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000
WORKDIR /app

# Create a non-root user
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# Copy the standalone build and necessary assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000

# Run as non-root
USER nextjs

# Start the Next.js standalone server
CMD ["node", "server.js"]

