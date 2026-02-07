export interface Bot {
  id: string;
  name: string;
  image: string;
  env: Record<string, string>;
  volumes?: Array<{
    source: string;
    target: string;
  }>;
  createdAt: number;
  updatedAt: number;
  status: BotStatus;
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

export interface CreateBotRequest {
  name: string;
  image: string;
  env?: Record<string, string>;
  volumes?: Array<{
    source: string;
    target: string;
  }>;
}
