# syntax=docker/dockerfile:1

# -------- Base deps layer --------
FROM node:20-alpine AS deps
WORKDIR /app

# Install only production dependencies
COPY package.json ./
RUN npm install --omit=dev

# -------- Runtime image --------
FROM node:20-alpine AS runner
WORKDIR /app

# Set production env
ENV NODE_ENV=production
ENV PORT=3000

# Install runtime tools needed for health checks
RUN apk add --no-cache curl

# Copy node_modules from deps layer
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Expose the default app port
EXPOSE 3000

# Container healthcheck (Express /health endpoint)
# Use runtime PORT if provided by the task definition, defaulting to 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 CMD sh -c "curl -fsS http://127.0.0.1:${PORT:-3000}/health > /dev/null || exit 1"

# Start the server
CMD ["node", "server.js"]


