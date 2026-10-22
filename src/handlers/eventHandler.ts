import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { ExtendedClient } from '../client/ExtendedClient.js';
import type { Event } from '../types/index.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadEvents(client: ExtendedClient) {
  let eventsDir = path.resolve(__dirname, '../events');
  if (!fs.existsSync(eventsDir)) {
    eventsDir = path.resolve(process.cwd(), 'src/events');
  }

  if (!fs.existsSync(eventsDir)) {
    logger.warn(`[EventHandler] Events directory not found at: ${eventsDir}`);
    return;
  }

  const files = fs.readdirSync(eventsDir).filter(
    (file) => (file.endsWith('.ts') || file.endsWith('.js')) && !file.endsWith('.d.ts') && !file.endsWith('.map')
  );

  let eventCount = 0;

  for (const file of files) {
    const fullPath = path.join(eventsDir, file);
    try {
      const fileUrl = pathToFileURL(fullPath).href;
      const module = await import(fileUrl);

      for (const value of Object.values(module)) {
        if (!value || typeof value !== 'object') continue;

        if ('name' in value && 'execute' in value) {
          const event = value as Event;
          if (event.once) {
            client.once(event.name, (...args) => event.execute(client, ...args));
          } else {
            client.on(event.name, (...args) => event.execute(client, ...args));
          }
          eventCount++;
          logger.debug(`[EventHandler] Registered event: ${event.name} (${file})`);
        }
      }
    } catch (err) {
      logger.error(`[EventHandler] Failed to load event file ${file}:`, err);
    }
  }

  logger.success(`📡 [EventHandler] Successfully registered ${eventCount} Discord event listener(s).`);
}
