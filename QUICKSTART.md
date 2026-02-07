# Quick Start Guide 🚀

Get your OpenClaw trading bot army up and running in 5 minutes!

## Prerequisites

- ✅ Docker Desktop installed and running
- ✅ 12 or 24-word mnemonic (hardware wallet recommended for production)

## Step-by-Step Setup

### 1️⃣ Run the Setup Script

```bash
./docker-setup.sh
```

**First Run:** If `.env` doesn't exist, the script will create it and exit. Proceed to step 2.

**What it does:**
- Checks Docker is running
- Pulls official OpenClaw image from GitHub (`ghcr.io/openclaw/openclaw:2026.2.6-3`)
- Builds control center image
- Creates `openclaw-network` Docker network
- Starts all services

### 2️⃣ Configure Your Mnemonic

Open `.env` in your editor and set your mnemonic:

```env
MNEMONIC=word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12
```

**Important:**
- Use a **real BIP-39 mnemonic** (12 or 24 words)
- For testing, you can generate one at https://iancoleman.io/bip39/
- For production, use a **hardware wallet-generated mnemonic**
- Never share or commit this mnemonic

### 3️⃣ Run Setup Again

```bash
./docker-setup.sh
```

Now it will:
- ✅ Pull `ghcr.io/openclaw/openclaw:2026.2.6-3`
- ✅ Build control center
- ✅ Start all services

Wait for the success message!

### 4️⃣ Access the Control Center

Open your browser to:

```
http://localhost:3000
```

You should see the OpenClaw Control Center interface.

### 5️⃣ Create Your First Bot

1. Click the **"Create Bot"** button
2. Fill in the form:
   - **Name**: `Trading Bot Alpha`
   - **Image**: `ghcr.io/openclaw/openclaw:2026.2.6-3` (pre-filled)
   - **Environment Variables** (optional):
     ```
     ETH_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
     SLIPPAGE=0.5
     ```

3. Click **"Create"**

**What happens:**
- ✅ Control center generates a unique HD wallet (index 0)
- ✅ Bot container is created with OpenClaw pre-installed
- ✅ Private key and wallet address injected as environment variables
- ✅ Bot starts automatically
- ✅ You can view it in the dashboard

### 6️⃣ View Your Bot

In the dashboard, you'll see:

```
📦 Trading Bot Alpha
   Status: 🟢 Running
   Wallet: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
   Uptime: 2m 34s
   CPU: 12.5%
   Memory: 45.2%
```

Click on the bot to:
- View detailed stats
- See logs
- Start/Stop/Restart
- Delete bot

### 7️⃣ Create More Bots

Each additional bot gets the next wallet in the HD sequence:

```
Bot 1 → m/44'/60'/0'/0/0 → 0x742d...
Bot 2 → m/44'/60'/0'/0/1 → 0x8f3a...
Bot 3 → m/44'/60'/0'/0/2 → 0x1b2c...
```

**Benefits:**
- One mnemonic backs up all wallets
- Easy to recover all bot wallets
- Secure and deterministic

## Verification Checklist

✅ Docker Desktop is running
✅ `.env` file has a valid mnemonic
✅ Control center is accessible at http://localhost:3000
✅ OpenClaw gateway is running (check `docker ps`)
✅ You can create and see bots in the dashboard
✅ Bot shows wallet address in the UI
✅ Bot status shows "Running"

## What's Running?

Check with:

```bash
docker ps
```

You should see:

```
CONTAINER ID   IMAGE                              STATUS    PORTS
abc123def456   openclaw-control                   Up        0.0.0.0:3000->3000/tcp
789ghi012jkl   ghcr.io/openclaw/openclaw:2026.2.6-3   Up        0.0.0.0:18789->18789/tcp
mno345pqr678   ghcr.io/openclaw/openclaw:2026.2.6-3   Up        (your first bot)
```

## Next Steps

### Fund Your Bot Wallets

1. Get the wallet addresses from the UI
2. Send **test amounts** first (0.01 ETH or equivalent)
3. Verify transactions work correctly
4. Scale up once validated

### Configure Trading Strategies

Each bot can have custom environment variables:

```json
{
  "name": "Arbitrage Bot",
  "env": {
    "STRATEGY": "arbitrage",
    "MIN_PROFIT": "0.5",
    "MAX_TRADE_SIZE": "1000",
    "ETH_RPC_URL": "https://mainnet.infura.io/v3/YOUR_KEY"
  }
}
```

### Monitor Your Bots

- 📊 Real-time dashboard updates every 5 seconds
- 📝 View logs via the UI or `docker logs openclaw-bot-{id}`
- 🔔 Set up alerts (future feature)

## Useful Commands

```bash
# View all logs
docker compose logs -f

# View specific service
docker compose logs -f openclaw-control
docker compose logs -f openclaw-gateway

# Stop everything
docker compose down

# Restart services
docker compose restart

# View bot containers only
docker ps --filter "label=openclaw.bot.managed=true"
```

## Troubleshooting

### "Docker is not running"

Start Docker Desktop and wait for it to fully initialize, then run the script again.

### "Failed to pull OpenClaw image"

The image might require authentication:

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Or use a personal access token
docker login ghcr.io -u YOUR_GITHUB_USERNAME
```

Then run the setup script again.

### "Network already exists" error

If you see a network conflict:

```bash
# Remove the network
docker network rm openclaw-network

# Run setup again
./docker-setup.sh
```

### Bot creation fails

1. Check the OpenClaw image exists:
   ```bash
   docker images | grep openclaw
   ```

2. Check network exists:
   ```bash
   docker network ls | grep openclaw-network
   ```

3. View control center logs:
   ```bash
   docker logs openclaw-control-center
   ```

### Bot doesn't start

1. View bot logs:
   ```bash
   docker logs openclaw-bot-{bot-id}
   ```

2. Check environment variables:
   ```bash
   docker inspect openclaw-bot-{bot-id} | grep -A 20 Env
   ```

3. Verify private key is injected (look for `PRIVATE_KEY` in env)

## Advanced Usage

### API Access

Create bots programmatically:

```bash
curl -X POST http://localhost:3000/api/bots \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Created Bot",
    "image": "ghcr.io/openclaw/openclaw:2026.2.6-3",
    "env": {
      "ETH_RPC_URL": "https://mainnet.infura.io/v3/YOUR_KEY"
    }
  }'
```

### View All Wallets

```bash
curl http://localhost:3000/api/wallets
```

### Get Next Available Wallet

```bash
curl http://localhost:3000/api/wallets/next
```

## Security Best Practices

1. **Development Environment**
   - Use a test mnemonic with no real funds
   - Test with testnets (Goerli, Sepolia, Mumbai)

2. **Production Environment**
   - Use hardware wallet-generated mnemonic
   - Store mnemonic in secure secrets management
   - Add authentication (reverse proxy with OAuth)
   - Enable SSL/TLS
   - Limit Docker socket access
   - Use firewall rules

3. **Never:**
   - ❌ Commit `.env` to git
   - ❌ Share your mnemonic
   - ❌ Use the same mnemonic for dev and prod
   - ❌ Store private keys in plain text logs

## Support

- 📚 Full docs: [README.md](README.md)
- 🔧 Detailed setup: [SETUP.md](SETUP.md)
- 🐛 Issues: Report on GitHub
- 💬 Community: OpenClaw Discord

---

**Ready to trade?** 🚀

Now that your bots are running, fund the wallets and configure your trading strategies. Always start with small amounts to test everything works correctly!

**⚠️ Disclaimer:** Trading crypto carries financial risk. This software is provided as-is. Test thoroughly before risking significant funds.
