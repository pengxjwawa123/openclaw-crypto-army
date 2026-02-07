# Master Wallet & Bot Wallet System

## Overview

The wallet system now uses a **master wallet** at index 0, with bot wallets starting from index 1.

## Architecture

```
Mnemonic (from .env)
  │
  ├─> m/44'/60'/0'/0/0 → Master Wallet (Index 0) - Displayed in UI
  │
  ├─> m/44'/60'/0'/0/1 → Bot 1 Wallet
  ├─> m/44'/60'/0'/0/2 → Bot 2 Wallet
  ├─> m/44'/60'/0'/0/3 → Bot 3 Wallet
  └─> m/44'/60'/0'/0/n → Bot N Wallet
```

## Master Wallet (Index 0)

### Purpose
- **Main funding wallet** - Send funds here to distribute to bots
- **Visible in UI** - Shows balance across multiple networks
- **Reserved** - Never used for bot operations

### Features
- ✅ Displays balance from Ethereum, BSC, and Polygon
- ✅ Shows address with copy-to-clipboard
- ✅ Auto-refreshes every 30 seconds
- ✅ Manual refresh button
- ✅ Network-specific balance breakdown

### API Endpoint
```bash
GET /api/wallets/master
```

**Response:**
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "derivationPath": "m/44'/60'/0'/0/0",
  "index": 0,
  "balances": {
    "ethereum": {
      "balance": "1000000000000000000",
      "formatted": "1.0000"
    },
    "bsc": {
      "balance": "500000000000000000",
      "formatted": "0.5000"
    },
    "polygon": {
      "balance": "250000000000000000",
      "formatted": "0.2500"
    }
  }
}
```

## Bot Wallets (Index 1+)

### Auto-Generation
Each bot automatically gets:
- Unique HD wallet starting from index 1
- Private key injected as `PRIVATE_KEY` environment variable
- Address injected as `WALLET_ADDRESS` environment variable

### Wallet Assignment
```typescript
// First bot created
Bot 1 → Index 1 → m/44'/60'/0'/0/1

// Second bot created
Bot 2 → Index 2 → m/44'/60'/0'/0/2

// Nth bot created
Bot N → Index N → m/44'/60'/0'/0/n
```

## Backend Changes

### 1. CryptoService (`src/backend/services/crypto.ts`)

**Updated:**
```typescript
export class CryptoService {
  private nextIndex: number = 1; // Start from 1, reserve 0 for master

  /**
   * Gets the master wallet (index 0)
   */
  getMasterWallet(): { privateKey: string; address: string; derivationPath: string } {
    return this.deriveWallet(0);
  }
}
```

### 2. Wallet Routes (`src/backend/routes/wallets.ts`)

**New endpoints:**
- `GET /api/wallets/master` - Get master wallet with balances
- `GET /api/wallets/next` - Preview next available wallet
- `GET /api/wallets/bots` - List all bot wallets

### 3. Index Initialization (`src/backend/index.ts`)

**Updated logic:**
```typescript
// Ensure minimum index is 1 (reserve 0 for master)
cryptoService.setNextIndex(Math.max(maxIndex + 1, 1));
```

## Frontend Changes

### 1. MasterWallet Component (`frontend/src/components/dashboard/MasterWallet.tsx`)

**Features:**
- Displays master wallet address
- Shows total balance across all networks
- Network-specific balance breakdown
- Copy address to clipboard
- Auto-refresh every 30 seconds
- Manual refresh button

### 2. Header Integration

**Location:** Dashboard header (top right)
```tsx
<MasterWallet />
```

### 3. API Client (`frontend/src/api.ts`)

**New method:**
```typescript
async getMasterWallet(): Promise<MasterWallet> {
  const res = await fetch(`${API_BASE}/wallets/master`);
  if (!res.ok) throw new Error('Failed to fetch master wallet');
  return res.json();
}
```

### 4. Types (`frontend/src/types.ts`)

**New interface:**
```typescript
export interface MasterWallet {
  address: string;
  derivationPath: string;
  index: number;
  balances: Record<string, {
    balance: string;
    formatted: string;
  }>;
}
```

## Configuration

### Environment Variables

**Required for balance fetching:**
```env
# Ethereum
ETH_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY

# BSC
BSC_RPC_URL=https://bsc-dataseed.binance.org

# Polygon
POLYGON_RPC_URL=https://polygon-rpc.com
```

**Already configured in `.env.example`**

## Usage

### 1. Fund Master Wallet

Send funds to the master wallet address (shown in UI):
```
0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

### 2. Check Balance

Balance is automatically displayed in the dashboard header:
- Shows total across all networks
- Updates every 30 seconds
- Click refresh icon to update manually

### 3. Distribute to Bots

From the master wallet, you can:
1. Send funds to individual bot wallets
2. Use a script to batch-distribute funds
3. Keep master wallet as main reserve

### 4. Create Bots

Bot wallets start from index 1 automatically:
```bash
# First bot
curl -X POST /api/bots \
  -d '{"name": "Bot 1"}' # Gets wallet at index 1

# Second bot
curl -X POST /api/bots \
  -d '{"name": "Bot 2"}' # Gets wallet at index 2
```

## Wallet Hierarchy

```
Master Wallet (Index 0)
├─ Purpose: Main funding & reserve
├─ Visibility: Shown in UI
├─ Balance: Tracked across networks
└─ Usage: Manual management

Bot Wallets (Index 1+)
├─ Purpose: Trading operations
├─ Visibility: Shown per bot
├─ Balance: Can be queried individually
└─ Usage: Automated by bots
```

## Security

### Master Wallet
- ✅ Private key stored only in backend
- ✅ Never exposed in API responses
- ✅ Derived from secure mnemonic
- ✅ Can be backed up via mnemonic

### Bot Wallets
- ✅ Each bot isolated with unique wallet
- ✅ Private keys injected securely
- ✅ No cross-contamination between bots
- ✅ Easy recovery via HD derivation

## Recovery

### If you lose the database:

```typescript
// Master wallet is always at index 0
const masterWallet = hdWallet.derivePath("m/44'/60'/0'/0/0");

// Bot wallets can be recovered if you know their indices
const bot1Wallet = hdWallet.derivePath("m/44'/60'/0'/0/1");
const bot2Wallet = hdWallet.derivePath("m/44'/60'/0'/0/2");
// etc.
```

### Backup Strategy

1. **Backup mnemonic** - Stores all wallets
2. **Record bot indices** - Know which bot uses which index
3. **Export bot configs** - Keep database backups

## Benefits

### 1. Clear Separation
- Master wallet for funding
- Bot wallets for operations

### 2. Easy Management
- One address to fund (master)
- Distribute to bots as needed

### 3. Visibility
- See total funds at a glance
- Track master wallet balance
- Network-specific breakdown

### 4. Security
- Segregated funds
- Easy to audit
- Clear accounting

## Example Workflow

```bash
# 1. Deploy system
./docker-setup.sh

# 2. Get master wallet address from UI
# Address: 0x742d35Cc...

# 3. Send 10 ETH to master wallet
# Use MetaMask or exchange

# 4. Check balance in UI
# Shows: 10.0000 ETH

# 5. Create bots (they get wallets automatically)
curl -X POST /api/bots -d '{"name": "Arbitrage Bot"}'
# Bot gets wallet at index 1

curl -X POST /api/bots -d '{"name": "Sniper Bot"}'
# Bot gets wallet at index 2

# 6. Fund bot wallets from master (external script)
# Transfer 1 ETH from master to bot 1
# Transfer 1 ETH from master to bot 2
```

---

**Master Wallet** = Your main treasury 💰
**Bot Wallets** = Individual trading accounts 🤖
