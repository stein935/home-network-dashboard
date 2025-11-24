# Production Dockerfile - Uses pre-built frontend from local machine
# This Dockerfile expects the frontend to be already built (dist/ folder exists)

FROM node:20-alpine

WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY packages/server/package*.json ./packages/server/

# Install only production dependencies
RUN npm ci --omit=dev --workspace=home-dashboard-server

# Copy backend source
COPY packages/server ./packages/server

# Copy pre-built frontend (built locally before Docker build)
COPY packages/client/dist ./packages/client/dist

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Expose port (accessed via Cloudflare Tunnel, not directly)
EXPOSE 3031

# Start the server
CMD ["node", "packages/server/server.js"]
