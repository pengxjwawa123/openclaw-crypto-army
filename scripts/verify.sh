#!/bin/bash

echo "Verifying OpenClaw Control Center setup..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi
echo "✓ Node.js $(node --version)"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed"
    echo "   Install with: npm install -g pnpm"
    exit 1
fi
echo "✓ pnpm $(pnpm --version)"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed (required for production)"
else
    echo "✓ Docker $(docker --version | cut -d' ' -f3)"
fi

# Check backend dependencies
if [ ! -d "node_modules" ]; then
    echo "❌ Backend dependencies not installed"
    echo "   Run: pnpm install"
    exit 1
fi
echo "✓ Backend dependencies installed"

# Check frontend dependencies
if [ ! -d "frontend/node_modules" ]; then
    echo "❌ Frontend dependencies not installed"
    echo "   Run: cd frontend && pnpm install"
    exit 1
fi
echo "✓ Frontend dependencies installed"

# Check data directory
if [ ! -d "data" ]; then
    echo "⚠️  Data directory not found, creating..."
    mkdir -p data
fi
echo "✓ Data directory exists"

echo ""
echo "✅ Setup verification complete!"
echo ""
echo "Start development:"
echo "  pnpm run dev"
echo ""
echo "Build for production:"
echo "  pnpm run build"
echo ""
echo "Deploy with Docker:"
echo "  ./scripts/deploy.sh"
