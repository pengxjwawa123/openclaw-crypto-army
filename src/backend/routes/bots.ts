import { Router, Request, Response } from 'express';
import { DockerManager } from '../services/docker';
import { CryptoService } from '../services/crypto';
import { BotCreateRequest, BotUpdateRequest, BotConfig } from '../types/bot';
import { v4 as uuidv4 } from 'uuid';
import {
  saveBotConfig,
  getBotConfig,
  getAllBotConfigs,
  deleteBotConfig,
} from '../services/database';

export function createBotRouter(dockerManager: DockerManager, cryptoService: CryptoService): Router {
  const router = Router();

  // List all bots
  router.get('/', async (req: Request, res: Response) => {
    try {
      const configs = await getAllBotConfigs();
      const statuses = await dockerManager.getAllBotStatuses();

      const bots = configs.map(config => {
        const status = statuses.find(s => s.id === config.id);
        // Remove private key from response
        const safeConfig = {
          ...config,
          wallet: config.wallet ? {
            address: config.wallet.address,
            derivationPath: config.wallet.derivationPath,
            index: config.wallet.index,
          } : undefined,
        };
        return {
          ...safeConfig,
          status: status || { id: config.id, state: 'stopped' },
        };
      });

      res.json({ bots });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single bot
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const config = await getBotConfig(id);

      if (!config) {
        return res.status(404).json({ error: 'Bot not found' });
      }

      const status = await dockerManager.getBotStatus(id);

      // Remove private key from response
      const safeConfig = {
        ...config,
        wallet: config.wallet ? {
          address: config.wallet.address,
          derivationPath: config.wallet.derivationPath,
          index: config.wallet.index,
        } : undefined,
      };

      res.json({
        ...safeConfig,
        status: status || { id, state: 'stopped' },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create new bot
  router.post('/', async (req: Request, res: Response) => {
    try {
      const body: BotCreateRequest = req.body;

      if (!body.name || !body.image) {
        return res.status(400).json({ error: 'Name and image are required' });
      }

      // Generate a unique wallet for this bot
      const wallet = cryptoService.generateWallet();

      const config: BotConfig = {
        id: uuidv4(),
        name: body.name,
        image: body.image,
        env: {
          ...body.env,
          // Automatically inject the private key as an environment variable
          PRIVATE_KEY: wallet.privateKey,
          WALLET_ADDRESS: wallet.address,
          // Inject OpenClaw Gateway Token if configured
          ...(process.env.OPENCLAW_GATEWAY_TOKEN && { OPENCLAW_GATEWAY_TOKEN: process.env.OPENCLAW_GATEWAY_TOKEN }),
        },
        volumes: body.volumes || [],
        wallet: {
          address: wallet.address,
          privateKey: wallet.privateKey,
          derivationPath: wallet.derivationPath,
          index: cryptoService.getNextIndex() - 1,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await saveBotConfig(config);
      const containerId = await dockerManager.createBot(config);

      // Don't send the private key in the response for security
      const responseConfig = {
        ...config,
        wallet: config.wallet ? {
          address: config.wallet.address,
          derivationPath: config.wallet.derivationPath,
          index: config.wallet.index,
        } : undefined,
      };

      res.status(201).json({
        ...responseConfig,
        containerId,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update bot config
  router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const body: BotUpdateRequest = req.body;

      const config = await getBotConfig(id);
      if (!config) {
        return res.status(404).json({ error: 'Bot not found' });
      }

      const updatedConfig: BotConfig = {
        ...config,
        name: body.name || config.name,
        env: body.env || config.env,
        updatedAt: Date.now(),
      };

      await saveBotConfig(updatedConfig);

      res.json(updatedConfig);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Recreate bot with updated environment variables
  router.post('/:id/recreate', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { env } = req.body;

      const config = await getBotConfig(id);
      if (!config) {
        return res.status(404).json({ error: 'Bot not found' });
      }

      // Update config with new environment variables
      const updatedConfig: BotConfig = {
        ...config,
        env: {
          ...config.env,
          ...env,
          // Ensure critical env vars are preserved
          PRIVATE_KEY: config.env.PRIVATE_KEY,
          WALLET_ADDRESS: config.env.WALLET_ADDRESS,
          ...(process.env.OPENCLAW_GATEWAY_TOKEN && { OPENCLAW_GATEWAY_TOKEN: process.env.OPENCLAW_GATEWAY_TOKEN }),
        },
        updatedAt: Date.now(),
      };

      await saveBotConfig(updatedConfig);

      // Recreate the container with new environment
      const containerId = await dockerManager.recreateBot(updatedConfig);

      res.json({
        success: true,
        containerId,
        message: 'Bot recreated with updated environment variables',
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete bot
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await dockerManager.removeBot(id);
      await deleteBotConfig(id);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Start bot
  router.post('/:id/start', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await dockerManager.startBot(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stop bot
  router.post('/:id/stop', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await dockerManager.stopBot(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Restart bot
  router.post('/:id/restart', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await dockerManager.restartBot(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get bot logs
  router.get('/:id/logs', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const tail = parseInt(req.query.tail as string) || 100;

      const logs = await dockerManager.getBotLogs(id, tail);
      res.json({ logs });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
