import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN is required in .env'),
  DISCORD_CLIENT_ID: z.string().min(1, 'DISCORD_CLIENT_ID is required in .env'),
  DISCORD_DEV_GUILD_ID: z.string().optional(),
  
  DB_DRIVER: z.enum(['sqlite', 'turso', 'postgres']).default('sqlite'),
  DB_SQLITE_PATH: z.string().default('local.db'),
  
  TURSO_DATABASE_URL: z.string().optional(),
  TURSO_AUTH_TOKEN: z.string().optional(),
  
  DATABASE_URL: z.string().optional(),
  
  PORT: z.string().default('8080').transform((val) => parseInt(val, 10)),
  DEFAULT_PREFIX: z.string().default('!'),
  DEFAULT_MAX_SLOTS: z.string().default('25').transform((val) => parseInt(val, 10)),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid or missing environment configuration:');
    result.error.errors.forEach((err) => {
      console.error(`   - ${err.path.join('.')}: ${err.message}`);
    });
    // In dev or CI, don't crash immediately if token is not yet provided so scripts like tsc can run
    if (!process.env.DISCORD_TOKEN) {
      console.warn('⚠️ Warning: Running without valid DISCORD_TOKEN. Set this in .env before starting the bot.');
    }
  }
  return (result.success ? result.data : process.env) as unknown as Env;
}

export const env = validateEnv();
