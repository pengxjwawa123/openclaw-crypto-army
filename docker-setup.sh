#!/bin/bash
set -e

echo "🚀 OpenClaw Crypto Army - Docker Setup"
echo "========================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file and set your MNEMONIC and other configurations"
    echo "   Then run this script again."
    exit 0
fi

echo "✅ Environment file found"
echo ""

# Load environment variables
source .env

# Check if MNEMONIC is set
if [ "$MNEMONIC" = "your twelve word mnemonic phrase goes here for wallet generation" ]; then
    echo "⚠️  WARNING: Please set a real MNEMONIC in your .env file"
    echo "   Each bot will derive a unique wallet from this mnemonic."
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p ~/.openclaw
mkdir -p ./data
echo "✅ Directories created"
echo ""

# Create Docker network
echo "🔗 Creating Docker network..."
if docker network inspect openclaw-network >/dev/null 2>&1; then
    echo "✅ Network 'openclaw-network' already exists"
else
    docker network create openclaw-network
    echo "✅ Network 'openclaw-network' created"
fi
echo ""

# Pull OpenClaw image
echo "📥 Pulling official OpenClaw image from GitHub Container Registry..."
echo "   Version: 2026.2.24"
if docker pull ghcr.io/openclaw/openclaw:2026.2.24; then
    echo "✅ OpenClaw image (version 2026.2.24) pulled successfully"
else
    echo "❌ Failed to pull OpenClaw image"
    echo "   Make sure you have access to ghcr.io/openclaw/openclaw:2026.2.6-3"
    echo "   You may need to authenticate with GitHub Container Registry:"
    echo "   docker login ghcr.io -u YOUR_GITHUB_USERNAME"
    exit 1
fi
echo ""

# Build the control center image
echo "🏗️  Building Control Center image..."
docker compose build openclaw-control
echo "✅ Control Center image built successfully"
echo ""

# Start services
echo "🚀 Starting services..."
docker compose up -d openclaw-control openclaw-gateway
echo "✅ Services started successfully"
echo ""

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check service status
echo ""
echo "📊 Service Status:"
docker compose ps
echo ""

# Display access information
echo "✅ Setup Complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 OpenClaw Crypto Army is now running!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 Control Center:  http://localhost:3000"
echo "🔧 OpenClaw Gateway: http://localhost:18789"
echo ""
echo "📚 Next Steps:"
echo "  1. Open http://localhost:3000 in your browser"
echo "  2. Click 'Create Bot' to create a new trading bot"
echo "  3. Each bot will automatically get a unique wallet/private key"
echo ""
echo "🔑 Bot Configuration:"
echo "  - Each bot uses the 'ghcr.io/openclaw/openclaw:2026.2.6-3' image"
echo "  - Private keys are auto-generated from your MNEMONIC"
echo "  - Wallets are hierarchically deterministic (HD)"
echo ""
echo "🛠️  Useful Commands:"
echo "  - View logs:          docker compose logs -f"
echo "  - Stop services:      docker compose down"
echo "  - Restart services:   docker compose restart"
echo "  - Configure channels: docker compose run --rm openclaw-cli channels login"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
