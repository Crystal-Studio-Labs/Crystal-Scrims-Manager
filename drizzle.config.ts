import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DB_DRIVER === 'turso' && process.env.TURSO_DATABASE_URL
      ? process.env.TURSO_DATABASE_URL
      : `file:${process.env.DB_SQLITE_PATH || 'local.db'}`,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
