import { ExtendedClient } from './client/ExtendedClient.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  logger.info('💎 Starting Crystal Scrims Manager...');

  const client = new ExtendedClient();

  if (!env.DISCORD_TOKEN) {
    logger.warn('⚠️ No DISCORD_TOKEN provided in .env. Bot gateway connection skipped.');
    logger.info('👉 Add your DISCORD_TOKEN and DISCORD_CLIENT_ID to .env to bring the bot online.');
    // In dev without token, still load handlers to verify syntax and components
    await client.loadHandlers();
    return;
  }

  await client.init(env.DISCORD_TOKEN);
}

// Global exception handling
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
});

bootstrap();
