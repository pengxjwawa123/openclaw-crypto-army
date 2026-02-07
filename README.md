# OpenClaw Crypto Army 🤖💰

A powerful control center for managing multiple OpenClaw trading bots with automatic wallet generation and private key management.

## 🚀 Quick Start

### 1. Run Setup Script

```bash
./docker-setup.sh
```

### 2. Configure Mnemonic

Edit `.env` and set your 12-word mnemonic:

```env
MNEMONIC=word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12
```

### 3. Open Control Center

Navigate to http://localhost:3000

### 4. Create Your First Bot

Click **"Create Bot"** and fill in:
- **Name**: `My Trading Bot`
- **Image**: `ghcr.io/openclaw/openclaw:2026.2.6-3` (auto-filled)

✅ Each bot automatically gets:
- Unique wallet address and private key
- OpenClaw pre-configured
- Environment variables injected

## Features

- 🎯 **Web-based Control Center** - Manage all bots from one interface
- 🔐 **HD Wallet Generation** - Each bot gets a unique wallet from master mnemonic
- 🐳 **Docker Integration** - Uses official OpenClaw image from GitHub Container Registry
- 📊 **Real-time Monitoring** - CPU, memory, uptime, and logs
- 🔑 **Secure Key Management** - Private keys auto-injected, never exposed in API
- 🌐 **Multi-chain Support** - Ethereum, BSC, Polygon, and more

## Architecture

```
Control Center (Port 3000)
    ├─── OpenClaw Gateway (Port 18789)
    └─── Bot Containers (ghcr.io/openclaw/openclaw:2026.2.6-3)
         ├─── Bot 1 (Wallet m/44'/60'/0'/0/0)
         ├─── Bot 2 (Wallet m/44'/60'/0'/0/1)
         └─── Bot N (Wallet m/44'/60'/0'/0/n)
```

### Tech Stack

**Backend:**
- Node.js + Express + TypeScript
- dockerode (Docker Engine API)
- WebSocket for real-time updates
- ethers.js for HD wallet generation

**Frontend:**
- React + TypeScript
- Tailwind CSS
- Vite

## Bot Configuration

Each bot receives these environment variables automatically:

| Variable | Description |
|----------|-------------|
| `BOT_ID` | Unique bot identifier |
| `BOT_NAME` | Bot name |
| `PRIVATE_KEY` | Bot's private key (from HD wallet) |
| `WALLET_ADDRESS` | Bot's wallet address |

You can also pass custom environment variables:

```json
{
  "name": "Arbitrage Bot",
  "env": {
    "ETH_RPC_URL": "https://mainnet.infura.io/v3/YOUR_KEY",
    "SLIPPAGE": "0.5",
    "STRATEGY": "arbitrage"
  }
}
```

## Wallet System

Uses BIP-39/BIP-44 HD wallets:

```
Master Mnemonic → m/44'/60'/0'/0/0 → Bot 1
               → m/44'/60'/0'/0/1 → Bot 2
               → m/44'/60'/0'/0/n → Bot N
```

**Benefits:**
- One mnemonic backs up all wallets
- Deterministic and reproducible
- Each bot has unique address
- No need to manage individual keys

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

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MNEMONIC` | Yes | - | Master mnemonic for HD wallet generation |
| `PORT` | No | 3000 | Control center port |
| `NODE_ENV` | No | production | Environment mode |
| `DATA_DIR` | No | /app/data | Database directory |
| `OPENCLAW_GATEWAY_URL` | No | http://openclaw-gateway:18789 | OpenClaw gateway URL |

### Docker Images Used

- **Control Center**: Built from `Dockerfile` in this repo
- **OpenClaw Bots**: `ghcr.io/openclaw/openclaw:2026.2.6-3` (official image)
- **OpenClaw Gateway**: `ghcr.io/openclaw/openclaw:2026.2.6-3`

## Security Notes

- 🔐 Control center requires Docker socket access (`/var/run/docker.sock`)
- 🌐 All containers isolated in `openclaw-network`
- 🔑 Private keys stored encrypted, never exposed in API responses
- ⚠️ **NEVER commit `.env` file** - contains your mnemonic
- 🎯 Use different mnemonics for development and production
- 🛡️ Add reverse proxy with authentication for production deployments

## License

MIT
