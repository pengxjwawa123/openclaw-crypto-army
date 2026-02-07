#!/bin/bash

set -e

echo "Setting up OpenClaw Control Center..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed"
    exit 1
fi

# Create OpenClaw network
echo "Creating Docker network..."
docker network create openclaw 2>/dev/null || echo "Network already exists"

# Create data directory
echo "Creating data directory..."
mkdir -p data

# Install dependencies
echo "Installing dependencies..."
pnpm install
cd frontend && pnpm install && cd ..

echo "Setup complete!"
echo ""
echo "Development:"
echo "  npm run dev"
echo ""
echo "Production:"
echo "  docker-compose up -d"
