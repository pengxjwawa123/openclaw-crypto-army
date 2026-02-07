import { Bot, CreateBotRequest } from './types';

const API_BASE = '/api';

export const api = {
  async getBots(): Promise<Bot[]> {
    const res = await fetch(`${API_BASE}/bots`);
    if (!res.ok) throw new Error('Failed to fetch bots');
    const data = await res.json();
    return data.bots;
  },

  async getBot(id: string): Promise<Bot> {
    const res = await fetch(`${API_BASE}/bots/${id}`);
    if (!res.ok) throw new Error('Failed to fetch bot');
    return res.json();
  },

  async createBot(request: CreateBotRequest): Promise<Bot> {
    const res = await fetch(`${API_BASE}/bots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error('Failed to create bot');
    return res.json();
  },

  async deleteBot(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/bots/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete bot');
  },

  async startBot(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/bots/${id}/start`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to start bot');
  },

  async stopBot(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/bots/${id}/stop`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to stop bot');
  },

  async restartBot(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/bots/${id}/restart`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to restart bot');
  },

  async getBotLogs(id: string, tail: number = 100): Promise<string[]> {
    const res = await fetch(`${API_BASE}/bots/${id}/logs?tail=${tail}`);
    if (!res.ok) throw new Error('Failed to fetch logs');
    const data = await res.json();
    return data.logs;
  },
};
