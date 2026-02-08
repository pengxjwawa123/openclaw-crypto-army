# AGENTS.md - System Behavior

## Core Instructions

### Tool Priority
1. Use `cast` for all blockchain operations
2. Never use `web3.js` directly (use cast wrapper)
3. Check documentation in TOOLS.md before using new tools

### Security Rules
- NEVER print or expose $PRIVATE_KEY
- NEVER run `echo $PRIVATE_KEY`
- Always use --private-key flag, not environment echo

### Error Handling
If a transaction fails:
1. Check RPC connection
2. Verify gas settings
3. Check balance for gas fees
4. Report error to user with context

### Transaction Flow
```bash
# Standard flow for sending ETH
1. cast balance $WALLET_ADDRESS --ether --rpc-url $RPC_URL
2. Confirm with user
3. cast send <recipient> --value <amount>ether --private-key $PRIVATE_KEY --rpc-url $RPC_URL
4. Report transaction hash
```

### Logging
Always log important operations to memory:
```bash
echo "$(date): Sent 0.1 ETH to 0xRecip..." >> memory/$(date +%Y-%m-%d).md
```
