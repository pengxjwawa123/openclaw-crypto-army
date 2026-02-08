# TOOLS.md - Available Tools

## Foundry Cast

### Check Balance
```bash
cast balance <address> --ether --rpc-url $RPC_URL
```

### Send ETH
```bash
cast send <recipient> \
  --value <amount>ether \
  --private-key $PRIVATE_KEY \
  --rpc-url $RPC_URL
```

### Check Token Balance
```bash
cast call <token_address> \
  "balanceOf(address)(uint256)" \
  <wallet_address> \
  --rpc-url $RPC_URL
```

### Send ERC-20 Token
```bash
cast send <token_address> \
  "transfer(address,uint256)" \
  <recipient> \
  <amount_in_wei> \
  --private-key $PRIVATE_KEY \
  --rpc-url $RPC_URL
```

## Helper Scripts

Located in `~/scripts/`:
- `web3-ops.sh balance` - Check ETH balance
- `web3-ops.sh send-eth <to> <amount>` - Send ETH
- `web3-ops.sh token-balance <token>` - Check token balance
