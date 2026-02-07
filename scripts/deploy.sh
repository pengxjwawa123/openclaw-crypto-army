#!/bin/bash

set -e

echo "Deploying OpenClaw Control Center..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed"
    exit 1
fi

# Create network
echo "Creating Docker network..."
docker network create openclaw 2>/dev/null || echo "Network already exists"

# Build and start
echo "Building and starting services..."
docker-compose up -d --build

echo "Deployment complete!"
echo "Access the control center at: http://localhost:3000"
