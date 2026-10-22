import { ActivityType } from 'discord.js';
import type { Event } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { startHealthServer } from '../server/health.js';
import { env } from '../config/env.js';

export const readyEvent: Event = {
  name: 'ready',
  once: true,
  execute(client) {
    logger.success(`💎 Crystal Scrims Manager logged in as ${client.user?.tag}!`);
    logger.info(`   Serving ${client.guilds.cache.size} guild(s) and ${client.users.cache.size} user(s).`);

    // Set bot presence
    client.user?.setPresence({
      activities: [
        {
          name: 'Scrims & Tournaments | /scrim',
          type: ActivityType.Watching,
        },
      ],
      status: 'online',
    });

    // Start HTTP Healthcheck keep-alive server for Render / Koyeb / Fly.io
    startHealthServer(client, env.PORT);
  },
};
