import { ActivityType } from 'discord.js';
import type { Event } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { startHealthServer } from '../server/health.js';
import { SchedulerService } from '../services/schedulerService.js';
import { LiveLeaderboardService } from '../services/liveLeaderboardService.js';
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
          name: 'Scrims & Tournaments | /help',
          type: ActivityType.Watching,
        },
      ],
      status: 'online',
    });

    // 1. Start HTTP Healthcheck & Web Dashboard server for Render / Koyeb / Fly.io
    startHealthServer(client, env.PORT);

    // 2. Start Automated Daily Recurring Scrims Scheduler
    SchedulerService.start(client);

    // 3. Start Real-Time Live Event Leaderboards Auto-Sync (60s interval)
    LiveLeaderboardService.startPeriodicSync(client, 60000);
  },
};
