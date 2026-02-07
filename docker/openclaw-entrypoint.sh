#!/bin/bash
set -e

echo "Starting OpenClaw Bot..."
echo "Bot ID: ${BOT_ID:-unknown}"
echo "Wallet Address: ${WALLET_ADDRESS:-not set}"

# Create OpenClaw config directory if it doesn't exist
mkdir -p $OPENCLAW_HOME

# Initialize OpenClaw configuration with the private key
if [ -n "$PRIVATE_KEY" ]; then
    echo "Configuring OpenClaw with provided private key..."

    # Create OpenClaw config file with the private key
    cat > $OPENCLAW_HOME/config.json <<EOF
{
  "wallet": {
    "privateKey": "$PRIVATE_KEY",
    "address": "$WALLET_ADDRESS"
  },
  "networks": {
    "ethereum": {
      "rpcUrl": "${ETH_RPC_URL:-https://mainnet.infura.io/v3/YOUR_KEY}",
      "chainId": ${ETH_CHAIN_ID:-1}
    },
    "bsc": {
      "rpcUrl": "${BSC_RPC_URL:-https://bsc-dataseed.binance.org}",
      "chainId": ${BSC_CHAIN_ID:-56}
    },
    "polygon": {
      "rpcUrl": "${POLYGON_RPC_URL:-https://polygon-rpc.com}",
      "chainId": ${POLYGON_CHAIN_ID:-137}
    }
  },
  "trading": {
    "slippage": ${SLIPPAGE:-0.5},
    "gasLimit": ${GAS_LIMIT:-500000}
  }
}
EOF

    echo "OpenClaw configured successfully!"
    echo "Wallet: $WALLET_ADDRESS"
else
    echo "WARNING: No PRIVATE_KEY provided. Bot will run without wallet functionality."
fi

# Set up workspace directory
mkdir -p $WORKSPACE_DIR
cd $WORKSPACE_DIR

# Initialize OpenClaw workspace if needed
if [ ! -f "$WORKSPACE_DIR/.openclaw-init" ]; then
    echo "Initializing OpenClaw workspace..."
    # Add any OpenClaw initialization commands here
    touch $WORKSPACE_DIR/.openclaw-init
fi

# Run custom initialization script if provided
if [ -f "$OPENCLAW_HOME/custom-init.sh" ]; then
    echo "Running custom initialization script..."
    bash $OPENCLAW_HOME/custom-init.sh
fi

# Execute the command passed to the container
echo "Starting bot process..."
exec "$@"
