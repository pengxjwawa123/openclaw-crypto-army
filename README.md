# OpenClaw Control Center

A Portainer-like control center for managing multiple OpenClaw bot instances.

## Architecture

### Backend
- **Node.js + Express + TypeScript**: REST API server
- **dockerode**: Docker Engine API client
- **WebSocket**: Real-time bot status updates
- **lowdb**: JSON-based database for bot configurations

### Frontend
- **React + TypeScript**: UI framework
- **Tailwind CSS**: Styling
- **Vite**: Build tool

### Features
- Create, start, stop, restart, and delete bot instances
- Real-time monitoring (CPU, memory, uptime)
- View container logs
- Isolated container networking
- Persistent bot configurations

## Deployment

### Using Docker Compose (Recommended)

```bash
# Create the OpenClaw network
docker network create openclaw

# Start the control center
docker-compose up -d

# Access at http://localhost:3000
```

### Manual Docker Build

```bash
# Build image
docker build -t openclaw-control .

# Run container
docker run -d \
  --name openclaw-control \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -v openclaw-data:/app/data \
  --network openclaw \
  openclaw-control
```

## Development

### Prerequisites
- Node.js 20+
- Docker Desktop (or Docker Engine)

### Setup

```bash
# Install backend dependencies
pnpm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Start development servers
pnpm run dev
```

Development servers:
- Backend: http://localhost:3000/api
- Frontend: http://localhost:5173
- WebSocket: ws://localhost:3000/ws

## API Endpoints

### Bots
- `GET /api/bots` - List all bots
- `GET /api/bots/:id` - Get bot details
- `POST /api/bots` - Create new bot
- `PATCH /api/bots/:id` - Update bot config
- `DELETE /api/bots/:id` - Delete bot
- `POST /api/bots/:id/start` - Start bot
- `POST /api/bots/:id/stop` - Stop bot
- `POST /api/bots/:id/restart` - Restart bot
- `GET /api/bots/:id/logs` - Get bot logs

### Health
- `GET /api/health` - Health check

## WebSocket Events

### Client → Server
- `ping` - Connection check

### Server → Client
- `bot:status` - Bot status updates (bulk every 5s)
- `bot:created` - New bot created
- `bot:removed` - Bot removed
- `bot:error` - Bot error occurred

## Configuration

Environment variables:
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)
- `DATA_DIR` - Database directory (default: ./data)

## Security Notes

- The control center requires access to Docker socket (`/var/run/docker.sock`)
- All bot containers are isolated in the `openclaw` network
- Bot configurations are persisted in JSON format
- No authentication implemented (add reverse proxy with auth for production)

## License

MIT
