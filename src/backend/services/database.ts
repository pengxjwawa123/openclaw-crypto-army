import { JSONFilePreset } from 'lowdb/node';
import { BotConfig } from '../types/bot';
import path from 'path';

export interface Transaction {
  id: string;
  hash: string;
  from: string;
  to: string;
  amount: string;
  botId: string;
  botName: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  blockNumber?: number;
  gasUsed?: string;
  error?: string;
}

export interface ENSSubdomain {
  id: string;
  botId: string;
  subdomain: string; // e.g., "my-trading"
  fullDomain: string; // e.g., "my-trading.openclawcrypto.eth"
  address: string; // Container wallet address
  transactionHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  error?: string;
}

export interface ChatMessage {
  id: string;
  botId: string;
  sender: 'user' | 'bot';
  message: string;
  timestamp: number;
  command?: string; // Original command if message is a response
  error?: string;
}

interface Database {
  bots: BotConfig[];
  transactions: Transaction[];
  ensSubdomains: ENSSubdomain[];
  chatMessages: ChatMessage[];
}

const defaultData: Database = { bots: [], transactions: [], ensSubdomains: [], chatMessages: [] };

let db: Awaited<ReturnType<typeof JSONFilePreset<Database>>> | null = null;

export async function initDatabase() {
  const dataDir = process.env.DATA_DIR || './data';
  const dbPath = path.join(dataDir, 'db.json');

  db = await JSONFilePreset<Database>(dbPath, defaultData);

  // Migration: Add transactions array if it doesn't exist
  if (!db.data.transactions) {
    db.data.transactions = [];
    await db.write();
  }

  // Migration: Add ensSubdomains array if it doesn't exist
  if (!db.data.ensSubdomains) {
    db.data.ensSubdomains = [];
    await db.write();
  }

  // Migration: Add chatMessages array if it doesn't exist
  if (!db.data.chatMessages) {
    db.data.chatMessages = [];
    await db.write();
  }

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

export async function saveTransaction(transaction: Transaction): Promise<void> {
  const database = getDatabase();
  const index = database.data.transactions.findIndex(t => t.id === transaction.id);

  if (index >= 0) {
    database.data.transactions[index] = transaction;
  } else {
    database.data.transactions.push(transaction);
  }

  await database.write();
}

export async function getTransaction(id: string): Promise<Transaction | undefined> {
  const database = getDatabase();
  return database.data.transactions.find(t => t.id === id);
}

export async function getTransactionByHash(hash: string): Promise<Transaction | undefined> {
  const database = getDatabase();
  return database.data.transactions.find(t => t.hash === hash);
}

export async function getBotTransactions(botId: string): Promise<Transaction[]> {
  const database = getDatabase();
  return database.data.transactions.filter(t => t.botId === botId).sort((a, b) => b.timestamp - a.timestamp);
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const database = getDatabase();
  return database.data.transactions.sort((a, b) => b.timestamp - a.timestamp);
}

export async function saveENSSubdomain(subdomain: ENSSubdomain): Promise<void> {
  const database = getDatabase();
  const index = database.data.ensSubdomains.findIndex(s => s.id === subdomain.id);

  if (index >= 0) {
    database.data.ensSubdomains[index] = subdomain;
  } else {
    database.data.ensSubdomains.push(subdomain);
  }

  await database.write();
}

export async function getENSSubdomain(id: string): Promise<ENSSubdomain | undefined> {
  const database = getDatabase();
  return database.data.ensSubdomains.find(s => s.id === id);
}

export async function getENSSubdomainByBotId(botId: string): Promise<ENSSubdomain | undefined> {
  const database = getDatabase();
  return database.data.ensSubdomains.find(s => s.botId === botId && s.status === 'confirmed');
}

export async function getAllENSSubdomains(): Promise<ENSSubdomain[]> {
  const database = getDatabase();
  return database.data.ensSubdomains.sort((a, b) => b.timestamp - a.timestamp);
}

export async function saveChatMessage(message: ChatMessage): Promise<void> {
  const database = getDatabase();
  database.data.chatMessages.push(message);
  await database.write();
}

export async function getBotChatMessages(botId: string): Promise<ChatMessage[]> {
  const database = getDatabase();
  return database.data.chatMessages.filter(m => m.botId === botId).sort((a, b) => a.timestamp - b.timestamp);
}

export async function clearBotChatMessages(botId: string): Promise<void> {
  const database = getDatabase();
  database.data.chatMessages = database.data.chatMessages.filter(m => m.botId !== botId);
  await database.write();
}
