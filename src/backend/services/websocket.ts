import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { DockerManager } from './docker';
import { BotEvent, BotStatus } from '../types/bot';

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(server: Server, private dockerManager: DockerManager) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupWebSocket();
    this.setupDockerEvents();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('Client connected');
      this.clients.add(ws);

      // Send initial bot statuses
      this.sendInitialData(ws);

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        console.log('Client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }

  private async sendInitialData(ws: WebSocket) {
    try {
      const statuses = await this.dockerManager.getAllBotStatuses();
      this.sendToClient(ws, {
        type: BotEvent.STATUS_UPDATE,
        data: statuses,
      });
    } catch (error) {
      console.error('Failed to send initial data:', error);
    }
  }

  private setupDockerEvents() {
    // Bulk status updates (every 5 seconds)
    this.dockerManager.on('bot:status:bulk', (statuses: BotStatus[]) => {
      this.broadcast({
        type: BotEvent.STATUS_UPDATE,
        data: statuses,
      });
    });

    // Individual bot events
    this.dockerManager.on('bot:created', (data) => {
      this.broadcast({ type: BotEvent.CREATED, data });
    });

    this.dockerManager.on('bot:removed', (data) => {
      this.broadcast({ type: BotEvent.REMOVED, data });
    });

    this.dockerManager.on('bot:error', (data) => {
      this.broadcast({ type: BotEvent.ERROR, data });
    });

    // State change events
    ['bot:started', 'bot:stopped', 'bot:restarted'].forEach(event => {
      this.dockerManager.on(event, async (data) => {
        const status = await this.dockerManager.getBotStatus(data.id);
        if (status) {
          this.broadcast({
            type: BotEvent.STATUS_UPDATE,
            data: [status],
          });
        }
      });
    });
  }

  private handleMessage(ws: WebSocket, message: any) {
    switch (message.type) {
      case 'ping':
        this.sendToClient(ws, { type: 'pong' });
        break;

      case 'subscribe:logs':
        // Future: implement log streaming
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private broadcast(message: any) {
    const payload = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  private sendToClient(client: WebSocket, message: any) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  async cleanup() {
    this.clients.forEach(client => client.close());
    this.wss.close();
  }
}
