import { Router, Request, Response } from 'express';
import { DockerManager } from '../services/docker';
import { BotCreateRequest, BotUpdateRequest, BotConfig } from '../types/bot';
import { v4 as uuidv4 } from 'uuid';
import {
  saveBotConfig,
  getBotConfig,
  getAllBotConfigs,
  deleteBotConfig,
} from '../services/database';

export function createBotRouter(dockerManager: DockerManager): Router {
  const router = Router();

  // List all bots
  router.get('/', async (req: Request, res: Response) => {
    try {
      const configs = await getAllBotConfigs();
      const statuses = await dockerManager.getAllBotStatuses();

      const bots = configs.map(config => {
        const status = statuses.find(s => s.id === config.id);
        return {
          ...config,
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

      res.json({
        ...config,
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

      const config: BotConfig = {
        id: uuidv4(),
        name: body.name,
        image: body.image,
        env: body.env || {},
        volumes: body.volumes || [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await saveBotConfig(config);
      const containerId = await dockerManager.createBot(config);

      res.status(201).json({
        ...config,
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
