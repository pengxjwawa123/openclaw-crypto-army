# Quick Start Guide

## Production Deployment (Docker)

```bash
# 1. Run deployment script
./scripts/deploy.sh

# 2. Access the UI
open http://localhost:3000
```

## Development Setup

```bash
# 1. Run setup script
./scripts/setup.sh

# 2. Start development servers
pnpm run dev

# 3. Access the UI (Vite dev server)
open http://localhost:5173
```

## Create Your First Bot

1. Click "Create Bot" button
2. Fill in:
   - **Name**: `test-bot-1`
   - **Docker Image**: `openclaw/bot:latest` (or your image)
   - **Environment Variables**: Add any required env vars
3. Click "Create Bot"

The bot container will be created and started automatically.

## Bot Operations

- **Start**: Start a stopped bot
- **Stop**: Stop a running bot
- **Restart**: Restart a running bot
- **Logs**: View container logs
- **Delete**: Remove bot and its container

## Real-time Monitoring

Bot status updates automatically every 5 seconds via WebSocket:
- Container state (running/stopped/error)
- CPU usage percentage
- Memory usage percentage
- Uptime

## Architecture Overview

```
┌─────────────────────────────────────┐
│   React Frontend (Port 5173/3000)  │
│   - Bot Management UI               │
│   - Real-time Status Display        │
└──────────────┬──────────────────────┘
               │ REST API + WebSocket
┌──────────────▼──────────────────────┐
│   Express Backend (Port 3000)       │
│   - Bot CRUD Operations             │
│   - Docker Container Management     │
│   - WebSocket Status Broadcasting   │
└──────────────┬──────────────────────┘
               │ dockerode
┌──────────────▼──────────────────────┐
│   Docker Engine                     │
│   - openclaw-network (bridge)       │
│   - Bot Containers (isolated)       │
└─────────────────────────────────────┘
```

## File Structure

```
openclaw-crypto-army/
├── src/backend/
│   ├── index.ts              # Express server entry
│   ├── types/bot.ts          # TypeScript interfaces
│   ├── services/
│   │   ├── docker.ts         # dockerode wrapper
│   │   ├── websocket.ts      # WebSocket server
│   │   └── database.ts       # lowdb persistence
│   └── routes/
│       └── bots.ts           # REST API routes
├── frontend/
│   └── src/
│       ├── App.tsx           # Main React component
│       ├── api.ts            # API client
│       ├── useWebSocket.ts   # WebSocket hook
│       └── components/       # UI components
├── Dockerfile                # Multi-stage build
├── docker-compose.yml        # Orchestration
└── scripts/                  # Utility scripts
```

## Troubleshooting

### Cannot connect to Docker daemon
```bash
# macOS/Linux: Ensure Docker is running
docker ps

# Linux: Add user to docker group
sudo usermod -aG docker $USER
```

### Network not found
```bash
# Recreate the OpenClaw network
docker network create openclaw
```

### Port already in use
```bash
# Change port in docker-compose.yml or .env
PORT=3001 npm run dev
```

### Database corruption
```bash
# Remove data directory
rm -rf data/
mkdir data
```
