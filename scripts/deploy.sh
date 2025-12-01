#!/bin/bash

# Deploy to Cloud - Optimized workflow
# Builds frontend locally, transfers only runtime artifacts to VM

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
VM_USER="${VM_USER:-ubuntu}"
VM_HOST="${VM_HOST}"
VM_PATH="${VM_PATH:-~/home-network-dashboard}"
SSH_KEY="${SSH_KEY:-~/.ssh/id_rsa}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Optimized Cloud Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if VM_HOST is set
if [ -z "$VM_HOST" ]; then
  echo -e "${RED}Error: VM_HOST environment variable is not set${NC}"
  echo "Usage: VM_HOST=your-vm-ip ./scripts/deploy.sh"
  echo "Or: export VM_HOST=your-vm-ip && npm run deploy"
  exit 1
fi

echo -e "${GREEN}✓ Configuration:${NC}"
echo "  VM: $VM_USER@$VM_HOST"
echo "  Path: $VM_PATH"
echo "  SSH Key: $SSH_KEY"
echo ""

# Step 1: Build frontend locally
echo -e "${BLUE}[1/6] Building frontend locally...${NC}"
npm run build --workspace=home-dashboard-client
echo -e "${GREEN}✓ Frontend built${NC}"
echo ""

# Step 2: Verify build output exists
if [ ! -d "packages/client/dist" ]; then
  echo -e "${RED}Error: Build output not found at packages/client/dist${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Build artifacts verified${NC}"
echo ""

# Step 3: Create remote directory
echo -e "${BLUE}[2/6] Creating remote directory...${NC}"
ssh -i "$SSH_KEY" "$VM_USER@$VM_HOST" "mkdir -p $VM_PATH"
echo -e "${GREEN}✓ Remote directory ready${NC}"
echo ""

# Step 4: Transfer files using rsync
echo -e "${BLUE}[3/6] Transferring files to VM...${NC}"
rsync -avz --delete \
  --exclude-from='.deployignore' \
  -e "ssh -i $SSH_KEY" \
  ./ "$VM_USER@$VM_HOST:$VM_PATH/"
echo -e "${GREEN}✓ Files transferred${NC}"
echo ""

# Step 5: Skip .env transfer (use existing .env on VM)
echo -e "${BLUE}[4/6] Skipping .env transfer (using existing .env on VM)...${NC}"
echo -e "${GREEN}✓ Using production .env on VM${NC}"
echo ""

# Step 6: Build and start Docker containers on VM
echo -e "${BLUE}[5/6] Building and starting Docker containers...${NC}"
ssh -i "$SSH_KEY" "$VM_USER@$VM_HOST" << 'ENDSSH'
cd ~/home-network-dashboard

# Build Docker image
docker-compose down -t 30 2>/dev/null || true
docker-compose build --no-cache
docker-compose up -d

# Show status
echo ""
echo "Container status:"
docker-compose ps
ENDSSH
echo -e "${GREEN}✓ Containers started${NC}"
echo ""

# Step 7: Show logs
echo -e "${BLUE}[6/6] Deployment complete!${NC}"
echo ""
echo -e "${GREEN}Your application should now be running at:${NC}"
echo "  https://steineck.io"
echo ""
echo -e "${BLUE}To view logs:${NC}"
echo "  ssh -i $SSH_KEY $VM_USER@$VM_HOST 'cd $VM_PATH && docker-compose logs -f'"
echo ""
echo -e "${BLUE}To check status:${NC}"
echo "  ssh -i $SSH_KEY $VM_USER@$VM_HOST 'cd $VM_PATH && docker-compose ps'"
echo ""
