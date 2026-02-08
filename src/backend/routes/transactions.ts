import { Router, Request, Response } from 'express';
import { CryptoService } from '../services/crypto';
import { JsonRpcProvider, Wallet, parseEther, formatEther } from 'ethers';
import { saveTransaction, getBotTransactions, getTransaction } from '../services/database';
import { v4 as uuidv4 } from 'uuid';

export function createTransactionRouter(cryptoService: CryptoService): Router {
  const router = Router();

  // Send ETH from master wallet to bot wallet
  router.post('/send', async (req: Request, res: Response) => {
    try {
      const { to, amount, botId, botName } = req.body;

      // Validate inputs
      if (!to || !amount || !botId || !botName) {
        return res.status(400).json({ error: 'Missing required fields: to, amount, botId, botName' });
      }

      // Validate amount
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      // Get RPC URL
      const rpcUrl = process.env.ETH_RPC_URL;
      if (!rpcUrl) {
        return res.status(500).json({ error: 'ETH_RPC_URL not configured' });
      }

      // Create provider
      const provider = new JsonRpcProvider(rpcUrl);

      // Get master wallet
      const masterWallet = cryptoService.getMasterWallet();
      const wallet = new Wallet(masterWallet.privateKey, provider);

      // Check balance
      const balance = await provider.getBalance(wallet.address);
      const balanceInEth = parseFloat(formatEther(balance));

      if (balanceInEth < amountNum) {
        return res.status(400).json({
          error: 'Insufficient balance',
          balance: balanceInEth.toFixed(4),
          required: amountNum.toFixed(4)
        });
      }

      // Create transaction ID
      const transactionId = uuidv4();

      // Create transaction object
      const tx = {
        to,
        value: parseEther(amount.toString()),
      };

      // Send transaction
      const txResponse = await wallet.sendTransaction(tx);

      // Save transaction to database (pending status)
      await saveTransaction({
        id: transactionId,
        hash: txResponse.hash,
        from: wallet.address,
        to,
        amount: amount.toString(),
        botId,
        botName,
        status: 'pending',
        timestamp: Date.now(),
      });

      // Wait for confirmation in background
      txResponse.wait().then(async (receipt) => {
        if (receipt) {
          await saveTransaction({
            id: transactionId,
            hash: txResponse.hash,
            from: wallet.address,
            to,
            amount: amount.toString(),
            botId,
            botName,
            status: 'confirmed',
            timestamp: Date.now(),
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
          });
        }
      }).catch(async (error) => {
        await saveTransaction({
          id: transactionId,
          hash: txResponse.hash,
          from: wallet.address,
          to,
          amount: amount.toString(),
          botId,
          botName,
          status: 'failed',
          timestamp: Date.now(),
          error: error.message,
        });
      });

      res.json({
        transactionId,
        hash: txResponse.hash,
        from: wallet.address,
        to,
        amount: amount.toString(),
        status: 'pending',
      });
    } catch (error: any) {
      console.error('Transaction error:', error);
      res.status(500).json({
        error: error.message || 'Failed to send transaction',
        details: error.reason || error.code
      });
    }
  });

  // Get transaction by ID
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const transaction = await getTransaction(id);

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.json(transaction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get transactions for a bot
  router.get('/bot/:botId', async (req: Request, res: Response) => {
    try {
      const { botId } = req.params;
      const transactions = await getBotTransactions(botId);

      res.json({ transactions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
