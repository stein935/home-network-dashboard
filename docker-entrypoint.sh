#!/bin/sh
set -e

# Ensure the data directory has correct permissions for the nodejs user
# Run as root to fix permissions, then switch to nodejs user
if [ "$(id -u)" = "0" ]; then
  echo "Setting up data directory permissions..."
  mkdir -p /app/data
  chown -R nodejs:nodejs /app/data
  echo "Permissions set. Starting application as nodejs user..."
  exec su-exec nodejs "$@"
else
  # Already running as nodejs user
  exec "$@"
fi
