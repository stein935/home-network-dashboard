# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

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

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create data directory with proper permissions
RUN mkdir -p /data && chown -R nodejs:nodejs /data

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3031

# Start the application
CMD ["node", "packages/server/server.js"]
