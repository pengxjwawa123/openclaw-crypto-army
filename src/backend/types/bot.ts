export interface BotConfig {
  id: string;
  name: string;
  image: string;
  env: Record<string, string>;
  volumes?: Array<{
    source: string;
    target: string;
  }>;
  wallet?: {
    address: string;
    privateKey: string;
    derivationPath: string;
    index: number;
  };
  createdAt: number;
  updatedAt: number;
}

export interface BotStatus {
  id: string;
  name: string;
  containerId?: string;
  state: 'running' | 'stopped' | 'paused' | 'error' | 'creating' | 'removing';
  status?: string;
  uptime?: number;
  cpu?: number;
  memory?: number;
  logs?: string[];
  error?: string;
}

export interface BotCreateRequest {
  name: string;
  image: string;
  env?: Record<string, string>;
  volumes?: Array<{
    source: string;
    target: string;
  }>;
}

export interface BotUpdateRequest {
  name?: string;
  env?: Record<string, string>;
}

export enum BotEvent {
  STATUS_UPDATE = 'bot:status',
  LOGS_UPDATE = 'bot:logs',
  ERROR = 'bot:error',
  CREATED = 'bot:created',
  REMOVED = 'bot:removed',
}
