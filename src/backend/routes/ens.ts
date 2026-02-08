import { Router, Request, Response } from 'express';
import { CryptoService } from '../services/crypto';
import { JsonRpcProvider, Wallet, namehash, Interface, Contract, keccak256, toUtf8Bytes } from 'ethers';
import { saveENSSubdomain, getENSSubdomainByBotId, getBotConfig } from '../services/database';
import { v4 as uuidv4 } from 'uuid';

// ENS Registry ABI (minimal - only the functions we need)
const ENS_REGISTRY_ABI = [
  'function setSubnodeRecord(bytes32 node, bytes32 label, address owner, address resolver, uint64 ttl)',
  'function owner(bytes32 node) view returns (address)',
];

// ENS Public Resolver ABI (minimal)
const ENS_RESOLVER_ABI = [
  'function setAddr(bytes32 node, address addr)',
  'function addr(bytes32 node) view returns (address)',
];

// ENS contract addresses (Sepolia testnet)
const ENS_REGISTRY_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const ENS_PUBLIC_RESOLVER_ADDRESS = '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD';

export function createENSRouter(cryptoService: CryptoService): Router {
  const router = Router();

  // Create subdomain for a bot
  router.post('/subdomain', async (req: Request, res: Response) => {
    try {
      const { botId, subdomain } = req.body;

      console.log('\n=== ENS Subdomain Creation Started ===');
      console.log('Bot ID:', botId);
      console.log('Subdomain:', subdomain);

      // Validate inputs
      if (!botId || !subdomain) {
        console.log('❌ Validation failed: Missing required fields');
        return res.status(400).json({ error: 'Missing required fields: botId, subdomain' });
      }

      // Validate subdomain format (lowercase alphanumeric and hyphens only)
      if (!/^[a-z0-9-]+$/.test(subdomain)) {
        console.log('❌ Validation failed: Invalid subdomain format');
        return res.status(400).json({
          error: 'Invalid subdomain format. Only lowercase letters, numbers, and hyphens allowed.',
        });
      }

      console.log('✓ Subdomain format validated');

      // Get bot config
      console.log('Fetching bot config...');
      const botConfig = await getBotConfig(botId);
      if (!botConfig || !botConfig.wallet) {
        console.log('❌ Bot not found or has no wallet');
        return res.status(404).json({ error: 'Bot not found or has no wallet' });
      }
      console.log('✓ Bot found:', botConfig.name);
      console.log('  Container address:', botConfig.wallet.address);

      // Check if subdomain already exists for this bot
      console.log('Checking for existing subdomain...');
      const existingSubdomain = await getENSSubdomainByBotId(botId);
      if (existingSubdomain) {
        console.log('❌ Bot already has subdomain:', existingSubdomain.fullDomain);
        return res.status(400).json({
          error: 'Bot already has a subdomain',
          subdomain: existingSubdomain.fullDomain,
        });
      }
      console.log('✓ No existing subdomain found');

      // Get RPC URL
      const rpcUrl = process.env.ETH_RPC_URL;
      if (!rpcUrl) {
        return res.status(500).json({ error: 'ETH_RPC_URL not configured' });
      }

      // Create provider
      const provider = new JsonRpcProvider(rpcUrl);

      // Get master wallet
      console.log('Getting master wallet...');
      const masterWallet = cryptoService.getMasterWallet();
      const wallet = new Wallet(masterWallet.privateKey, provider);
      console.log('✓ Master wallet address:', masterWallet.address);

      // Get master wallet's ENS name (reverse lookup)
      console.log('Looking up master wallet ENS name...');
      let parentDomain: string | null = null;
      try {
        parentDomain = await provider.lookupAddress(masterWallet.address);
      } catch (error) {
        console.log('❌ ENS lookup failed for master wallet:', error);
      }

      // Check if master wallet has an ENS name
      if (!parentDomain) {
        console.log('❌ Master wallet does not have an ENS name');
        return res.status(400).json({
          error: 'Master wallet does not have an ENS name. Please register an ENS name for your master wallet first.',
          masterWalletAddress: masterWallet.address,
        });
      }

      console.log('✓ Master wallet ENS name:', parentDomain);

      const fullDomain = `${subdomain}.${parentDomain}`;
      console.log('✓ Full domain to create:', fullDomain);

      // Calculate namehashes
      const parentNode = namehash(parentDomain);
      const labelHash = keccak256(toUtf8Bytes(subdomain)); // Label hash is keccak256 of the subdomain string
      const fullNode = namehash(fullDomain);

      // Create ENS Registry contract instance
      const ensRegistry = new Interface(ENS_REGISTRY_ABI);

      // Check who owns the parent domain
      console.log('Checking ENS domain ownership...');
      try {
        // Create contract instance to query owner
        const ensRegistryContract = new Contract(
          ENS_REGISTRY_ADDRESS,
          ENS_REGISTRY_ABI,
          provider
        );

        const domainOwner = await ensRegistryContract.owner(parentNode);
        console.log('  ENS domain owner:', domainOwner);
        console.log('  Master wallet address:', masterWallet.address);
        console.log('  Wallet being used to sign:', wallet.address);

        if (domainOwner.toLowerCase() !== wallet.address.toLowerCase()) {
          console.log('❌ WARNING: Master wallet does not own this ENS domain!');
          console.log('  Domain owner:', domainOwner);
          console.log('  Your wallet:', wallet.address);
          console.log('  Transaction will likely fail due to permission denied');
        } else {
          console.log('✓ Master wallet owns the ENS domain');
        }
      } catch (error) {
        console.log('❌ Failed to check domain ownership:', error);
      }

      // Check if wallet owns the parent domain
      try {
        console.log('Creating subdomain transaction...');
        // For now, we'll create a mock transaction since most users won't own an ENS domain
        // In production, you would:
        // 1. Verify parent domain ownership
        // 2. Call setSubnodeRecord to create subdomain
        // 3. Call setAddr on resolver to point to container address

        // Create subdomain ID
        const subdomainId = uuidv4();
        console.log('  Subdomain ID:', subdomainId);

        // Mock transaction hash (in production, this would be the real tx hash)
        const mockTxHash = `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        console.log('  Transaction hash:', mockTxHash);

        // Save to database with pending status
        console.log('Saving to database (pending status)...');
        await saveENSSubdomain({
          id: subdomainId,
          botId,
          subdomain,
          fullDomain,
          address: botConfig.wallet.address,
          transactionHash: mockTxHash,
          status: 'pending',
          timestamp: Date.now(),
        });
        console.log('✓ Saved to database');

        // In production environment: create real subdomain
        console.log('Attempting to create real ENS subdomain transaction...');

        // Create subdomain transaction
        const setSubnodeData = ensRegistry.encodeFunctionData('setSubnodeRecord', [
          parentNode,
          labelHash,
          wallet.address, // owner
          ENS_PUBLIC_RESOLVER_ADDRESS, // resolver
          0, // ttl
        ]);

        console.log('Sending setSubnodeRecord transaction...');
        let tx;
        let receipt;
        try {
          tx = await wallet.sendTransaction({
            to: ENS_REGISTRY_ADDRESS,
            data: setSubnodeData,
          });
          console.log('✓ Transaction sent:', tx.hash);
          console.log('Waiting for confirmation...');

          // Wait for transaction
          receipt = await tx.wait();
          console.log('✓ Transaction confirmed in block:', receipt?.blockNumber);

          // Check if the transaction succeeded
          if (receipt?.status === 0) {
            throw new Error('setSubnodeRecord transaction reverted');
          }
        } catch (error: any) {
          console.error('❌ Failed to create subdomain:', error);
          throw new Error(`Subdomain creation failed: ${error.message}. This is likely because the master wallet (${wallet.address}) does not own the parent ENS domain (${parentDomain}). The actual owner is different.`);
        }

        // Set address in resolver
        console.log('Setting address in resolver...');
        const resolver = new Interface(ENS_RESOLVER_ABI);
        const setAddrData = resolver.encodeFunctionData('setAddr', [
          fullNode,
          botConfig.wallet.address,
        ]);

        console.log('Sending setAddr transaction...');
        let resolverTx;
        let resolverReceipt;
        try {
          resolverTx = await wallet.sendTransaction({
            to: ENS_PUBLIC_RESOLVER_ADDRESS,
            data: setAddrData,
          });
          console.log('✓ Resolver transaction sent:', resolverTx.hash);
          console.log('Waiting for resolver confirmation...');

          resolverReceipt = await resolverTx.wait();
          console.log('✓ Resolver transaction confirmed in block:', resolverReceipt?.blockNumber);

          // Check if the transaction succeeded
          if (resolverReceipt?.status === 0) {
            throw new Error('setAddr transaction reverted');
          }
        } catch (error: any) {
          console.error('❌ Failed to set address in resolver:', error);
          throw new Error(`Resolver update failed: ${error.message}. The subdomain was created but the address could not be set in the resolver. This is likely a permission issue.`);
        }

        // Update database with confirmed status
        await saveENSSubdomain({
          id: subdomainId,
          botId,
          subdomain,
          fullDomain,
          address: botConfig.wallet.address,
          transactionHash: tx.hash,
          status: 'confirmed',
          timestamp: Date.now(),
        });

        console.log('✓ ENS subdomain creation successful');
        console.log('=== ENS Subdomain Creation Completed ===\n');

        res.json({
          subdomainId,
          fullDomain,
          address: botConfig.wallet.address,
          transactionHash: tx.hash,
          status: 'confirmed',
          blockNumber: receipt?.blockNumber,
          message: 'Subdomain successfully created on-chain',
        });
      } catch (error: any) {
        console.error('❌ ENS subdomain creation error:', error);
        console.log('=== ENS Subdomain Creation Failed ===\n');

        const subdomainId = uuidv4();
        await saveENSSubdomain({
          id: subdomainId,
          botId,
          subdomain,
          fullDomain,
          address: botConfig.wallet.address,
          transactionHash: '',
          status: 'failed',
          timestamp: Date.now(),
          error: error.message,
        });

        return res.status(500).json({
          error: 'Failed to create ENS subdomain',
          details: error.message,
        });
      }
    } catch (error: any) {
      console.error('❌ ENS route error:', error);
      console.log('=== ENS Subdomain Creation Failed ===\n');
      res.status(500).json({
        error: error.message || 'Failed to process ENS subdomain request',
      });
    }
  });

  // Get subdomain for a bot
  router.get('/subdomain/:botId', async (req: Request, res: Response) => {
    try {
      const { botId } = req.params;
      console.log('\n=== Fetching ENS Subdomain ===');
      console.log('Bot ID:', botId);

      const subdomain = await getENSSubdomainByBotId(botId);

      if (!subdomain) {
        console.log('No subdomain found for this bot');
        return res.status(404).json({ error: 'No subdomain found for this bot' });
      }

      console.log('✓ Subdomain found:', subdomain.fullDomain);
      console.log('  Status:', subdomain.status);
      console.log('  Address:', subdomain.address);
      console.log('=== Fetch Completed ===\n');

      res.json(subdomain);
    } catch (error: any) {
      console.error('❌ Error fetching subdomain:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
