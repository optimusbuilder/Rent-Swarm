#!/bin/bash

# Rent Swarm Application Update Script
# This script pulls the latest code and rebuilds the application
# Usage: ./update-app.sh

set -e  # Exit on any error

echo "========================================"
echo "Rent Swarm Application Update"
echo "========================================"
echo ""

# Get the script's directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "📂 Current directory: $(pwd)"
echo ""

echo "🔄 Step 1: Pulling latest changes from Git..."
git fetch origin
git pull origin main
echo "✓ Code updated successfully"

echo ""
echo "🛑 Step 2: Stopping running containers..."
cd "$SCRIPT_DIR"
docker-compose down
echo "✓ Containers stopped"

echo ""
echo "🏗️  Step 3: Rebuilding application..."
docker-compose build --no-cache nextjs
echo "✓ Application rebuilt"

echo ""
echo "🚀 Step 4: Starting services..."
docker-compose up -d
echo "✓ Services started"

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

echo ""
echo "📊 Step 5: Checking container status..."
docker-compose ps

echo ""
echo "📝 Recent logs:"
docker-compose logs --tail=20 nextjs

echo ""
echo "========================================"
echo "✅ Application update completed!"
echo "========================================"
echo ""
echo "Your application should now be running with the latest code."
echo ""
echo "To view logs:"
echo "  docker-compose logs -f"
echo ""
echo "To check status:"
echo "  docker-compose ps"
echo ""
echo "To test the application:"
echo "  curl https://api.rent-swarm.tech"
echo ""
