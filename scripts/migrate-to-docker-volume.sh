#!/bin/bash

# Migration script: Move production data from bind mount to Docker volume
# This script is only needed once when upgrading from the old deployment structure

set -e

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║   Migrate Production Data to Docker Volume                    ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if old database exists
if [ ! -f "./data/database.db" ]; then
	echo "⚠️  No existing production database found at ./data/database.db"
	echo "    This is normal for first-time deployments."
	echo "    Skipping migration."
	echo ""
	exit 0
fi

echo "Found existing production database at ./data/database.db"
echo ""

# Create Docker volume if it doesn't exist
echo "Creating Docker volume 'home-network-dashboard_production-data'..."
docker volume create home-network-dashboard_production-data
echo "✓ Volume created"
echo ""

# Copy data to Docker volume using temporary container
echo "Copying database to Docker volume..."
docker run --rm \
	-v $(pwd)/data:/source:ro \
	-v home-network-dashboard_production-data:/dest \
	alpine sh -c "
    mkdir -p /dest &&
    cp -v /source/database.db /dest/production.db &&
    cp -v /source/database.db-shm /dest/production.db-shm 2>/dev/null || true &&
    cp -v /source/database.db-wal /dest/production.db-wal 2>/dev/null || true &&
    echo '✓ Database files copied' &&
    ls -lh /dest/
  "

echo ""
echo "✓ Migration complete!"
echo ""
echo "Next steps:"
echo "  1. Run 'npm run deploy' to deploy with new database configuration"
echo "  2. The old ./data/ directory is preserved as backup"
echo "  3. You can safely delete ./data/ after verifying production works"
echo ""
