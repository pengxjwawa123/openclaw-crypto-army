#!/bin/bash

# OpenClaw Crypto Army - Complete Startup Script
# This script will:
# 1. Build custom OpenClaw+Foundry Docker image
# 2. Start OpenClaw Gateway
# 3. Install dependencies and start development server

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  OpenClaw Crypto Army - Startup Script${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Function to print colored messages
print_step() {
    echo -e "${YELLOW}>>> $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if Docker is running
print_step "Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi
print_success "Docker is running"
echo ""

# Step 1: Create openclaw-network if it doesn't exist
print_step "Step 1: Setting up Docker network..."
if ! docker network ls | grep -q openclaw-network; then
    docker network create openclaw-network
    print_success "Created openclaw-network"
else
    print_success "openclaw-network already exists"
fi
echo ""

# Step 2: Build custom OpenClaw+Foundry image
print_step "Step 2: Building custom OpenClaw+Foundry image..."
echo -e "${BLUE}This may take a few minutes on first run...${NC}"
docker build -f Dockerfile.openclaw-foundry -t openclaw-foundry:custom .

if [ $? -eq 0 ]; then
    print_success "Custom image built successfully!"

    # Verify Foundry installation
    echo ""
    print_step "Verifying Foundry installation..."
    docker run --rm openclaw-foundry:custom cast --version
    print_success "Foundry/Cast is ready!"
else
    print_error "Failed to build custom image"
    exit 1
fi
echo ""

# Step 3: Start OpenClaw Gateway
print_step "Step 3: Starting OpenClaw Gateway..."

# Check if gateway is already running
if docker ps | grep -q openclaw-gateway; then
    print_success "OpenClaw Gateway is already running"
else
    # Start the gateway
    docker compose -f docker-compose.openclaw.yml up -d openclaw-gateway

    # Wait for gateway to be healthy
    echo -e "${BLUE}Waiting for gateway to be ready...${NC}"
    sleep 5

    # Check if container is running
    if docker ps | grep -q openclaw-gateway; then
        print_success "OpenClaw Gateway started successfully!"
        echo -e "${GREEN}Gateway URL: http://localhost:18789${NC}"
    else
        print_error "Failed to start OpenClaw Gateway"
        echo "Checking logs..."
        docker logs openclaw-gateway
        exit 1
    fi
fi
echo ""

# Step 4: Install dependencies
print_step "Step 4: Installing dependencies..."
if command -v pnpm > /dev/null 2>&1; then
    pnpm install
    print_success "Dependencies installed"
else
    print_error "pnpm is not installed. Please install pnpm first:"
    echo "  npm install -g pnpm"
    exit 1
fi
echo ""

# Step 5: Start development server
print_step "Step 5: Starting development server..."
echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "${YELLOW}Available Services:${NC}"
echo -e "  • OpenClaw Gateway: ${GREEN}http://localhost:18789${NC}"
echo -e "  • Backend API: ${GREEN}http://localhost:3000${NC}"
echo -e "  • Frontend UI: ${GREEN}http://localhost:5173${NC}"
echo ""
echo -e "${YELLOW}Default Bot Image:${NC}"
echo -e "  • openclaw-foundry:custom ${GREEN}(with Foundry/Cast pre-installed)${NC}"
echo ""
echo -e "${YELLOW}Usage:${NC}"
echo -e "  1. Open ${GREEN}http://localhost:5173${NC} in your browser"
echo -e "  2. Click ${GREEN}'Create New Bot'${NC}"
echo -e "  3. Select image: ${GREEN}openclaw-foundry:custom${NC}"
echo -e "  4. Start chatting with your bot!"
echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${YELLOW}Starting development server...${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Start the dev server (this will keep running)
pnpm run dev
