# OpenClaw Crypto Army - Quick Start Guide

## 🚀 One-Command Startup

Run the complete startup script that handles everything:

```bash
./startup.sh
```

This script will automatically:
1. ✅ Create Docker network (`openclaw-network`)
2. ✅ Build custom OpenClaw+Foundry image (`openclaw-foundry:custom`)
3. ✅ Start OpenClaw Gateway container
4. ✅ Install dependencies (`pnpm install`)
5. ✅ Start development server (`pnpm run dev`)

## 📋 Prerequisites

Before running the startup script, ensure you have:

- ✅ **Docker Desktop** installed and running
- ✅ **Node.js** (v18 or later)
- ✅ **pnpm** installed (`npm install -g pnpm`)
- ✅ **.env file** configured with required environment variables

### Environment Variables (.env)

Make sure your `.env` file contains:

```bash
# API Keys
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENCLAW_GATEWAY_TOKEN=dev-token-12345

# Blockchain Configuration
RPC_URL=https://1rpc.io/sepolia
ETH_RPC_URL=https://1rpc.io/sepolia
CHAIN_ID=11155111

# Wallet Configuration
MNEMONIC=your twelve word mnemonic phrase here
```

## 🎯 What Happens After Startup

Once the script completes, you'll have:

### 1. OpenClaw Gateway (Port 18789)
- **URL**: http://localhost:18789
- **Purpose**: Handles AI agent coordination
- **Status**: Check with `docker ps | grep openclaw-gateway`

### 2. Backend API (Port 3000)
- **URL**: http://localhost:3000
- **Purpose**: REST API for bot management
- **Endpoints**:
  - `GET /api/bots` - List all bots
  - `POST /api/bots` - Create new bot
  - `POST /api/chat/:botId/send` - Send message to bot

### 3. Frontend UI (Port 5173)
- **URL**: http://localhost:5173
- **Purpose**: Web dashboard for managing bots

## 🤖 Creating Your First Bot

### Via Web UI

1. Open http://localhost:5173 in your browser
2. Click **"Create New Bot"**
3. Choose image:
   - **OpenClaw + Foundry (Recommended)** - Has Foundry Cast pre-installed
   - **OpenClaw Standard** - Official OpenClaw image
4. Enter bot name (e.g., `trading-bot-1`)
5. Click **"Create Bot"**

### What Gets Injected Automatically

When you create a bot, these are automatically configured:

**Environment Variables:**
- `PRIVATE_KEY` - Unique HD wallet private key (derived from mnemonic)
- `WALLET_ADDRESS` - Corresponding Ethereum address
- `RPC_URL` - Blockchain RPC endpoint (from .env)
- `ETH_RPC_URL` - Alias for RPC_URL
- `CHAIN_ID` - Network chain ID (11155111 for Sepolia)
- `ANTHROPIC_API_KEY` - For AI features
- `OPENCLAW_GATEWAY_TOKEN` - For gateway authentication

**Volume Mounts:**
- `~/.openclaw/workflow` → `/root/.openclaw/workflow` (shared workflow data)
- `./data/bots/{botName}` → `/app/data` (bot-specific data)
- `./workspace/{botName}` → `/workspace` (bot workspace)

## 🔧 Using Foundry Cast in Bots

If you selected the **OpenClaw + Foundry** image, you can use Cast commands:

```bash
# Get the bot container name
docker ps | grep openclaw-bot

# Execute Cast commands inside the bot
docker exec openclaw-bot-<bot-id> cast block-number --rpc-url $RPC_URL
docker exec openclaw-bot-<bot-id> cast balance $WALLET_ADDRESS --rpc-url $RPC_URL

# Send a transaction
docker exec openclaw-bot-<bot-id> cast send <to-address> \
  --value 0.1ether \
  --private-key $PRIVATE_KEY \
  --rpc-url $RPC_URL
```

## 🛠 Manual Setup (Alternative)

If you prefer to run steps manually:

### Step 1: Build Custom Image
```bash
docker build -f Dockerfile.openclaw-foundry -t openclaw-foundry:custom .
```

### Step 2: Create Network
```bash
docker network create openclaw-network
```

### Step 3: Start Gateway
```bash
docker compose -f docker-compose.openclaw.yml up -d openclaw-gateway
```

### Step 4: Install & Run
```bash
pnpm install
pnpm run dev
```

## 🐛 Troubleshooting

### Docker network error
```bash
# Remove and recreate network
docker network rm openclaw-network
docker network create openclaw-network
```

### Gateway not healthy
```bash
# Check logs
docker logs openclaw-gateway

# Restart gateway
docker compose -f docker-compose.openclaw.yml restart openclaw-gateway
```

### Image build fails
```bash
# Clean build (no cache)
docker build --no-cache -f Dockerfile.openclaw-foundry -t openclaw-foundry:custom .
```

### Port already in use
```bash
# Check what's using the port
lsof -i :3000  # Backend
lsof -i :5173  # Frontend
lsof -i :18789 # Gateway

# Kill the process using the port
kill -9 <PID>
```

## 🔄 Stopping Everything

### Stop dev server
Press `Ctrl+C` in the terminal running `pnpm run dev`

### Stop gateway
```bash
docker compose -f docker-compose.openclaw.yml down
```

### Stop all bot containers
```bash
docker stop $(docker ps -q --filter "label=openclaw.bot.managed=true")
```

### Clean up everything
```bash
# Stop all containers
docker compose -f docker-compose.openclaw.yml down

# Remove bot containers
docker rm -f $(docker ps -aq --filter "label=openclaw.bot.managed=true")

# Remove network
docker network rm openclaw-network

# Remove images (optional)
docker rmi openclaw-foundry:custom
```

## 📚 Additional Resources

- [OpenClaw Documentation](https://docs.openclaw.com)
- [Foundry Book](https://book.getfoundry.sh)
- [Docker Documentation](https://docs.docker.com)

## 💡 Next Steps

After setup, you can:

1. **Create multiple bots** - Each with unique wallets
2. **Send commands via chat** - Interact with bots through the UI
3. **Execute blockchain operations** - Use Cast inside bot containers
4. **Monitor bot activity** - View logs and stats in the dashboard
5. **Scale your operation** - Run multiple bots in parallel

Enjoy your OpenClaw Crypto Army! 🚀
