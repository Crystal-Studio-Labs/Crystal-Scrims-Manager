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

  // Permissions & Roles
  DEFAULT_ORGANIZER_ROLE: z.string().default('Scrim Organizer'),
  ADMIN_API_KEY: z.string().default('crystal-admin-secret-2026'),

  // Default Outcome Announcement Visuals (GIFs / Images)
  DEFAULT_WIN_GIF: z.string().default('https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif'),
  DEFAULT_LOSS_GIF: z.string().default('https://media.giphy.com/media/3o7TKr3nzbh5WgCFxe/giphy.gif'),
  DEFAULT_DRAW_GIF: z.string().default('https://media.giphy.com/media/l4KhQo2MESJkc6QbS/giphy.gif'),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid or missing environment configuration:');
    result.error.errors.forEach((err) => {
      console.error(`   - ${err.path.join('.')}: ${err.message}`);
    });
    if (!process.env.DISCORD_TOKEN) {
      console.warn('⚠️ Warning: Running without valid DISCORD_TOKEN. Set this in .env before starting the bot.');
    }
  }
  return (result.success ? result.data : process.env) as unknown as Env;
}

export const env = validateEnv();
