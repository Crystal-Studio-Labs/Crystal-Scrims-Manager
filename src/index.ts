import { ExtendedClient } from './client/ExtendedClient.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { readyEvent } from './events/ready.js';
import { interactionCreateEvent } from './events/interactionCreate.js';

// Import Commands
import { pingCommand } from './commands/utility/ping.js';
import { helpCommand } from './commands/utility/help.js';
import { setupCommand } from './commands/admin/setup.js';
import { scrimCommand } from './commands/scrims/scrim.js';
import { announceCommand } from './commands/scrims/announce.js';
import { pointsCommand } from './commands/scrims/points.js';
import { 
  registerCommand, 
  registerButtonHandler, 
  registerModalHandler,
  viewSlotlistButtonHandler,
  viewIdpButtonHandler,
  leaveSlotButtonHandler,
  panelOpenButtonHandler,
  panelCloseButtonHandler,
  panelCancelButtonHandler
} from './commands/scrims/register.js';

async function bootstrap() {
  logger.info('💎 Starting Crystal Scrims Manager...');

  const client = new ExtendedClient();

  // 1. Register Commands
  client.commands.set(pingCommand.data.name, pingCommand);
  client.commands.set(helpCommand.data.name, helpCommand);
  client.commands.set(setupCommand.data.name, setupCommand);
  client.commands.set(scrimCommand.data.name, scrimCommand);
  client.commands.set(registerCommand.data.name, registerCommand);
  client.commands.set(announceCommand.data.name, announceCommand);
  client.commands.set(pointsCommand.data.name, pointsCommand);
  logger.info(`   Loaded ${client.commands.size} slash command(s).`);

  // 2. Register Button Handlers
  client.buttons.set(registerButtonHandler.customIdPrefix, registerButtonHandler);
  client.buttons.set(viewSlotlistButtonHandler.customIdPrefix, viewSlotlistButtonHandler);
  client.buttons.set(viewIdpButtonHandler.customIdPrefix, viewIdpButtonHandler);
  client.buttons.set(leaveSlotButtonHandler.customIdPrefix, leaveSlotButtonHandler);
  client.buttons.set(panelOpenButtonHandler.customIdPrefix, panelOpenButtonHandler);
  client.buttons.set(panelCloseButtonHandler.customIdPrefix, panelCloseButtonHandler);
  client.buttons.set(panelCancelButtonHandler.customIdPrefix, panelCancelButtonHandler);
  logger.info(`   Loaded ${client.buttons.size} button handler(s).`);

  // 3. Register Modal Handlers
  client.modals.set(registerModalHandler.customIdPrefix, registerModalHandler);
  logger.info(`   Loaded ${client.modals.size} modal handler(s).`);

  // 4. Register Event Listeners
  client.once(readyEvent.name, (...args) => readyEvent.execute(client, ...args));
  client.on(interactionCreateEvent.name, (...args) => interactionCreateEvent.execute(client, ...args));

  // 5. Connect to Discord Gateway
  if (!env.DISCORD_TOKEN) {
    logger.warn('⚠️ No DISCORD_TOKEN provided in .env. Bot gateway connection skipped.');
    logger.info('👉 Add your DISCORD_TOKEN and DISCORD_CLIENT_ID to .env to bring the bot online.');
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
