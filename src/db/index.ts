import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

function initDatabase() {
  const driver = env.DB_DRIVER;

  if (driver === 'turso') {
    if (!env.TURSO_DATABASE_URL) {
      throw new Error('TURSO_DATABASE_URL must be specified when DB_DRIVER=turso');
    }
    logger.info(`🔌 Connecting to Turso LibSQL at: ${env.TURSO_DATABASE_URL}`);
    const client = createClient({
      url: env.TURSO_DATABASE_URL,
      authToken: env.TURSO_AUTH_TOKEN,
    });
    return drizzle(client, { schema });
  }

  // Default: Local SQLite via @libsql/client file protocol (Zero-setup!)
  const dbPath = env.DB_SQLITE_PATH.startsWith('file:') 
    ? env.DB_SQLITE_PATH 
    : `file:${env.DB_SQLITE_PATH}`;
    
  logger.info(`🔌 Initializing Local SQLite database at: ${dbPath}`);
  const client = createClient({ url: dbPath });
  return drizzle(client, { schema });
}

export const db = initDatabase();
export * from './schema.js';
