import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http';
import { DockerManager } from './services/docker';
import { WebSocketService } from './services/websocket';
import { CryptoService } from './services/crypto';
import { createBotRouter } from './routes/bots';
import { createWalletRouter } from './routes/wallets';
import { createTransactionRouter } from './routes/transactions';
import { initDatabase, getAllBotConfigs } from './services/database';

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function main() {
  const app = express();
  const server = createServer(app);

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Initialize services
  console.log('Initializing database...');
  await initDatabase();

  console.log('Initializing crypto service...');
  const cryptoService = new CryptoService();

  // Load existing bot configs to set the next wallet index
  // Index 0 is reserved for master wallet, bots start from index 1
  const existingConfigs = await getAllBotConfigs();
  const maxIndex = existingConfigs.reduce((max, config) => {
    return config.wallet?.index !== undefined && config.wallet.index > max
      ? config.wallet.index
      : max;
  }, 0); // Start from 0, will increment to 1 for first bot
  cryptoService.setNextIndex(Math.max(maxIndex + 1, 1)); // Ensure minimum index is 1
  console.log(`Crypto service initialized. Next wallet index: ${Math.max(maxIndex + 1, 1)}`);

  console.log('Initializing Docker manager...');
  const dockerManager = new DockerManager();
  await dockerManager.initialize();

  console.log('Initializing WebSocket service...');
  const wsService = new WebSocketService(server, dockerManager);

  // API Routes
  app.use('/api/bots', createBotRouter(dockerManager, cryptoService));
  app.use('/api/wallets', createWalletRouter(cryptoService));
  app.use('/api/transactions', createTransactionRouter(cryptoService));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: Date.now(),
      version: '1.0.0',
    });
  });

  // Serve frontend in production
  if (NODE_ENV === 'production') {
    const frontendPath = path.join(__dirname, '../../frontend/dist');
    app.use(express.static(frontendPath));

    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
  }

  // Error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
      error: err.message || 'Internal server error',
    });
  });

  // Start server
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${NODE_ENV}`);
    if (NODE_ENV === 'development') {
      console.log(`API: http://localhost:${PORT}/api`);
      console.log(`WebSocket: ws://localhost:${PORT}/ws`);
    }
  });

  // Graceful shutdown
  const cleanup = async () => {
    console.log('\nShutting down gracefully...');
    await wsService.cleanup();
    await dockerManager.cleanup();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);
}

main().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
