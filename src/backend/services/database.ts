import { JSONFilePreset } from 'lowdb/node';
import { BotConfig } from '../types/bot';
import path from 'path';

interface Database {
  bots: BotConfig[];
}

const defaultData: Database = { bots: [] };

let db: Awaited<ReturnType<typeof JSONFilePreset<Database>>> | null = null;

export async function initDatabase() {
  const dataDir = process.env.DATA_DIR || './data';
  const dbPath = path.join(dataDir, 'db.json');

  db = await JSONFilePreset<Database>(dbPath, defaultData);
  return db;
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export async function saveBotConfig(config: BotConfig): Promise<void> {
  const database = getDatabase();
  const index = database.data.bots.findIndex(b => b.id === config.id);

  if (index >= 0) {
    database.data.bots[index] = config;
  } else {
    database.data.bots.push(config);
  }

  await database.write();
}

export async function getBotConfig(id: string): Promise<BotConfig | undefined> {
  const database = getDatabase();
  return database.data.bots.find(b => b.id === id);
}

export async function getAllBotConfigs(): Promise<BotConfig[]> {
  const database = getDatabase();
  return database.data.bots;
}

export async function deleteBotConfig(id: string): Promise<boolean> {
  const database = getDatabase();
  const index = database.data.bots.findIndex(b => b.id === id);

  if (index >= 0) {
    database.data.bots.splice(index, 1);
    await database.write();
    return true;
  }

  return false;
}
