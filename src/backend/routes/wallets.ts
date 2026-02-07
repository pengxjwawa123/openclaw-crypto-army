import { Router, Request, Response } from 'express';
import { CryptoService } from '../services/crypto';
import { JsonRpcProvider } from 'ethers';

export function createWalletRouter(cryptoService: CryptoService): Router {
  const router = Router();

  // Get master wallet info and balance
  router.get('/master', async (req: Request, res: Response) => {
    try {
      const masterWallet = cryptoService.getMasterWallet();

      // Get balance from multiple networks
      const balances: Record<string, { balance: string; formatted: string }> = {};

      // Ethereum mainnet
      if (process.env.ETH_RPC_URL) {
        try {
          const provider = new JsonRpcProvider(process.env.ETH_RPC_URL);
          const balance = await provider.getBalance(masterWallet.address);
          balances.ethereum = {
            balance: balance.toString(),
            formatted: (Number(balance) / 1e18).toFixed(4),
          };
        } catch (error) {
          console.error('Failed to fetch ETH balance:', error);
        }
      }

      // BSC
      if (process.env.BSC_RPC_URL) {
        try {
          const provider = new JsonRpcProvider(process.env.BSC_RPC_URL);
          const balance = await provider.getBalance(masterWallet.address);
          balances.bsc = {
            balance: balance.toString(),
            formatted: (Number(balance) / 1e18).toFixed(4),
          };
        } catch (error) {
          console.error('Failed to fetch BSC balance:', error);
        }
      }

      // Base Sepolia
      if (process.env.BASE_SEPOLIA_RPC_URL) {
        try {
          const provider = new JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL);
          const balance = await provider.getBalance(masterWallet.address);
          balances.base_sepolia = {
            balance: balance.toString(),
            formatted: (Number(balance) / 1e18).toFixed(4),
          };
        } catch (error) {
          console.error('Failed to fetch Base Sepolia balance:', error);
        }
      }

      res.json({
        address: masterWallet.address,
        derivationPath: masterWallet.derivationPath,
        index: 0,
        balances,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get next available wallet (for preview)
  router.get('/next', async (req: Request, res: Response) => {
    try {
      const nextIndex = cryptoService.getNextIndex();
      const nextWallet = cryptoService.deriveWallet(nextIndex);

      res.json({
        address: nextWallet.address,
        derivationPath: nextWallet.derivationPath,
        index: nextIndex,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all bot wallets (from database)
  router.get('/bots', async (req: Request, res: Response) => {
    try {
      // This would require importing the database service
      // For now, return empty array - implement later if needed
      res.json({ wallets: [] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
