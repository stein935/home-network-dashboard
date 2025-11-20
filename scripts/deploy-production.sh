#!/bin/bash

# Production deployment script with database protection
# This script safely deploys to production Docker containers

set -e  # Exit on error

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║   Production Deployment - Home Network Dashboard             ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Build frontend
echo "Step 1/5: Building frontend..."
npm run build --workspace=home-dashboard-client
echo "✓ Frontend built successfully"
echo ""

# Step 2: Backup production database (if container is running)
if docker ps | grep -q home-network-dashboard; then
  echo "Step 2/5: Backing up production database..."

  # Create backup directory inside container
  docker exec home-network-dashboard sh -c "mkdir -p /app/data/backups"

  # Create timestamped backup
  TIMESTAMP=$(date -u +"%Y-%m-%dT%H-%M-%S")
  docker exec home-network-dashboard sh -c "
    node -e \"
      const Database = require('better-sqlite3');
      const db = new Database('/app/data/production.db');
      db.backup('/app/data/backups/production-${TIMESTAMP}.db')
        .then(() => {
          console.log('✓ Backup created: production-${TIMESTAMP}.db');
          db.pragma('wal_checkpoint(TRUNCATE)');
          console.log('✓ WAL checkpoint completed');
          db.close();
        })
        .catch(err => {
          console.error('Backup failed:', err.message);
          process.exit(1);
        });
    \"
  "

  # Clean up old backups (keep last 10)
  docker exec home-network-dashboard sh -c "
    cd /app/data/backups &&
    ls -t production-*.db 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
  "

  echo "✓ Production database backed up"
else
  echo "Step 2/5: Skipping backup (first deployment)"
fi
echo ""

# Step 3: Stop containers gracefully
echo "Step 3/5: Stopping containers..."
docker-compose down -t 30
echo "✓ Containers stopped gracefully"
echo ""

# Step 4: Rebuild images
echo "Step 4/5: Building Docker images..."
docker-compose build --no-cache
echo "✓ Images built successfully"
echo ""

# Step 5: Start containers
echo "Step 5/5: Starting containers..."
docker-compose up -d
echo "✓ Containers started successfully"
echo ""

# Wait for containers to be ready
echo "Waiting for application to start..."
sleep 5

# Check container status
if docker ps | grep -q home-network-dashboard; then
  echo "✓ Deployment completed successfully!"
  echo ""
  echo "Container status:"
  docker-compose ps
  echo ""
  echo "View logs: docker-compose logs -f"
else
  echo "✗ Deployment failed - containers not running"
  echo "Check logs: docker-compose logs"
  exit 1
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║   Production URL: https://steineck.io                        ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
