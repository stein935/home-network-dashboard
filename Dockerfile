# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Copy workspace configuration
COPY package*.json ./

# Copy package files for both workspaces
COPY packages/client/package*.json ./packages/client/
COPY packages/server/package*.json ./packages/server/

# Install all dependencies (workspaces)
RUN npm ci

# Copy source code
COPY packages ./packages

# Build frontend
RUN npm run build --workspace=home-dashboard-client

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install build dependencies for native modules (better-sqlite3) and su-exec for user switching
RUN apk add --no-cache python3 make g++ su-exec

# Copy workspace configuration
COPY package*.json ./

# Copy server package.json
COPY packages/server/package*.json ./packages/server/

# Install production dependencies only
RUN npm ci --only=production --workspace=home-dashboard-server

# Copy built frontend from builder
COPY --from=builder /app/packages/client/dist ./packages/client/dist

# Copy server code
COPY packages/server ./packages/server

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create data directory (permissions will be set by entrypoint at runtime)
RUN mkdir -p /app/data

# Expose port
EXPOSE 3031

# Use entrypoint to set permissions before starting app
ENTRYPOINT ["docker-entrypoint.sh"]

# Start the application (will run as nodejs user via entrypoint)
CMD ["node", "packages/server/server.js"]
