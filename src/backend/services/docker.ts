import Docker from 'dockerode';
import { BotConfig, BotStatus } from '../types/bot';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

const LABEL_PREFIX = 'openclaw.bot';
const NETWORK_NAME = 'openclaw-network';
const DEFAULT_BOT_IMAGE = 'openclaw-foundry:custom';

export class DockerManager extends EventEmitter {
  private docker: Docker;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private containerStatsStreams: Map<string, NodeJS.ReadableStream> = new Map();

  constructor() {
    super();
    this.docker = new Docker({ socketPath: '/var/run/docker.sock' });
  }

  async initialize() {
    await this.ensureNetwork();
    this.startMonitoring();
  }

  private async ensureNetwork() {
    try {
      const networks = await this.docker.listNetworks({
        filters: { name: [NETWORK_NAME] }
      });

      if (networks.length === 0) {
        await this.docker.createNetwork({
          Name: NETWORK_NAME,
          Driver: 'bridge',
          Internal: false,
        });
      }
    } catch (error) {
      console.error('Failed to ensure network:', error);
      throw error;
    }
  }

  async createBot(config: BotConfig): Promise<string> {
    try {
      this.emit('bot:creating', { id: config.id, name: config.name });

      // Use default OpenClaw bot image if not specified
      const image = config.image || DEFAULT_BOT_IMAGE;

      // Pull image if not exists
      await this.pullImageIfNeeded(image);

      // Merge environment variables with bot-specific configs
      const envVars = {
        BOT_ID: config.id,
        BOT_NAME: config.name,
        ...config.env,
      };

      const containerConfig: Docker.ContainerCreateOptions = {
        name: `openclaw-bot-${config.id}`,
        Image: image,
        Env: Object.entries(envVars).map(([key, value]) => `${key}=${value}`),
        Labels: {
          [`${LABEL_PREFIX}.id`]: config.id,
          [`${LABEL_PREFIX}.name`]: config.name,
          [`${LABEL_PREFIX}.managed`]: 'true',
          [`${LABEL_PREFIX}.image`]: image,
        },
        HostConfig: {
          NetworkMode: NETWORK_NAME,
          RestartPolicy: { Name: 'unless-stopped' },
          Binds: config.volumes?.map(v => `${v.source}:${v.target}`) || [],
        },
      };

      const container = await this.docker.createContainer(containerConfig);
      await container.start();

      this.emit('bot:created', { id: config.id, containerId: container.id });
      return container.id;
    } catch (error: any) {
      this.emit('bot:error', { id: config.id, error: error.message });
      throw error;
    }
  }

  async startBot(botId: string): Promise<void> {
    const container = await this.getContainerByBotId(botId);
    if (!container) throw new Error('Bot container not found');

    await container.start();
    this.emit('bot:started', { id: botId });
  }

  async stopBot(botId: string): Promise<void> {
    const container = await this.getContainerByBotId(botId);
    if (!container) throw new Error('Bot container not found');

    await container.stop();
    this.emit('bot:stopped', { id: botId });
  }

  async restartBot(botId: string): Promise<void> {
    const container = await this.getContainerByBotId(botId);
    if (!container) throw new Error('Bot container not found');

    await container.restart();
    this.emit('bot:restarted', { id: botId });
  }

  async recreateBot(config: BotConfig): Promise<string> {
    try {
      this.emit('bot:recreating', { id: config.id, name: config.name });

      // Remove existing container if it exists
      const existingContainer = await this.getContainerByBotId(config.id);
      if (existingContainer) {
        const info = await existingContainer.inspect();
        if (info.State.Running) {
          await existingContainer.stop();
        }
        await existingContainer.remove();
        this.stopStatsStream(existingContainer.id);
      }

      // Create new container with updated config
      const containerId = await this.createBot(config);
      this.emit('bot:recreated', { id: config.id, containerId });
      return containerId;
    } catch (error: any) {
      this.emit('bot:error', { id: config.id, error: error.message });
      throw error;
    }
  }

  async removeBot(botId: string): Promise<void> {
    try {
      const container = await this.getContainerByBotId(botId);
      if (!container) return;

      const info = await container.inspect();
      if (info.State.Running) {
        await container.stop();
      }

      await container.remove();
      this.stopStatsStream(container.id);
      this.emit('bot:removed', { id: botId });
    } catch (error: any) {
      this.emit('bot:error', { id: botId, error: error.message });
      throw error;
    }
  }

  async getBotStatus(botId: string): Promise<BotStatus | null> {
    try {
      const container = await this.getContainerByBotId(botId);
      if (!container) return null;

      const info = await container.inspect();
      const stats = await this.getContainerStats(container.id);

      return {
        id: botId,
        name: info.Config.Labels[`${LABEL_PREFIX}.name`],
        containerId: container.id,
        state: this.mapContainerState(info.State),
        status: info.State.Status,
        uptime: info.State.Running ? Date.now() - new Date(info.State.StartedAt).getTime() : 0,
        cpu: stats?.cpu,
        memory: stats?.memory,
      };
    } catch (error) {
      return null;
    }
  }

  async getAllBotStatuses(): Promise<BotStatus[]> {
    try {
      const containers = await this.docker.listContainers({
        all: true,
        filters: {
          label: [`${LABEL_PREFIX}.managed=true`]
        }
      });

      const statuses: BotStatus[] = [];

      for (const containerInfo of containers) {
        const botId = containerInfo.Labels[`${LABEL_PREFIX}.id`];
        const container = this.docker.getContainer(containerInfo.Id);
        const info = await container.inspect();
        const stats = await this.getContainerStats(containerInfo.Id);

        statuses.push({
          id: botId,
          name: containerInfo.Labels[`${LABEL_PREFIX}.name`],
          containerId: containerInfo.Id,
          state: this.mapContainerState(info.State),
          status: info.State.Status,
          uptime: info.State.Running ? Date.now() - new Date(info.State.StartedAt).getTime() : 0,
          cpu: stats?.cpu,
          memory: stats?.memory,
        });
      }

      return statuses;
    } catch (error) {
      console.error('Failed to get bot statuses:', error);
      return [];
    }
  }

  async getBotLogs(botId: string, tail: number = 100): Promise<string[]> {
    try {
      const container = await this.getContainerByBotId(botId);
      if (!container) return [];

      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail,
        timestamps: true,
      });

      return logs.toString('utf-8').split('\n').filter(line => line.trim());
    } catch (error) {
      return [];
    }
  }

  async getContainerByBotId(botId: string): Promise<Docker.Container | null> {
    try {
      const containers = await this.docker.listContainers({
        all: true,
        filters: {
          label: [`${LABEL_PREFIX}.id=${botId}`]
        }
      });

      if (containers.length === 0) return null;
      return this.docker.getContainer(containers[0].Id);
    } catch (error) {
      return null;
    }
  }

  private async pullImageIfNeeded(image: string): Promise<void> {
    try {
      await this.docker.getImage(image).inspect();
    } catch (error) {
      // Image doesn't exist, pull it
      await new Promise<void>((resolve, reject) => {
        this.docker.pull(image, (err: any, stream: any) => {
          if (err) return reject(err);

          this.docker.modem.followProgress(stream, (err: any) => {
            if (err) return reject(err);
            resolve();
          });
        });
      });
    }
  }

  private async getContainerStats(containerId: string): Promise<{ cpu: number; memory: number } | null> {
    try {
      const container = this.docker.getContainer(containerId);
      const stats = await container.stats({ stream: false });

      const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
      const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
      const cpuPercent = (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;

      const memoryUsage = stats.memory_stats.usage || 0;
      const memoryLimit = stats.memory_stats.limit || 1;
      const memoryPercent = (memoryUsage / memoryLimit) * 100;

      return {
        cpu: Math.round(cpuPercent * 100) / 100,
        memory: Math.round(memoryPercent * 100) / 100,
      };
    } catch (error) {
      return null;
    }
  }

  private mapContainerState(state: any): BotStatus['state'] {
    if (state.Running) return 'running';
    if (state.Paused) return 'paused';
    if (state.Dead || state.OOMKilled) return 'error';
    return 'stopped';
  }

  private startMonitoring() {
    // Poll container statuses every 5 seconds
    this.monitoringInterval = setInterval(async () => {
      const statuses = await this.getAllBotStatuses();
      this.emit('bot:status:bulk', statuses);
    }, 5000);
  }

  private stopStatsStream(containerId: string) {
    const stream = this.containerStatsStreams.get(containerId);
    if (stream) {
      (stream as any).destroy?.();
      this.containerStatsStreams.delete(containerId);
    }
  }

  async cleanup() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    for (const [, stream] of this.containerStatsStreams) {
      (stream as any).destroy?.();
    }

    this.containerStatsStreams.clear();
  }
}
