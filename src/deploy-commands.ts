import { REST, Routes } from 'discord.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { pingCommand } from './commands/utility/ping.js';
import { scrimCommand } from './commands/scrims/scrim.js';
import { registerCommand } from './commands/scrims/register.js';

const commands = [
  pingCommand.data.toJSON(),
  scrimCommand.data.toJSON(),
  registerCommand.data.toJSON(),
];

const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

async function deploy() {
  try {
    logger.info(`Started refreshing ${commands.length} application (/) commands...`);

    if (env.DISCORD_DEV_GUILD_ID) {
      // Fast guild-specific deployment for testing
      logger.info(`Deploying commands directly to DEV GUILD: ${env.DISCORD_DEV_GUILD_ID}`);
      const data: any = await rest.put(
        Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_DEV_GUILD_ID),
        { body: commands }
      );
      logger.success(`Successfully reloaded ${data.length} guild (/) commands!`);
    } else {
      // Global deployment
      logger.info('Deploying commands GLOBALLY across all Discord guilds...');
      const data: any = await rest.put(
        Routes.applicationCommands(env.DISCORD_CLIENT_ID),
        { body: commands }
      );
      logger.success(`Successfully reloaded ${data.length} global (/) commands!`);
    }
  } catch (error) {
    logger.error('Failed to deploy application commands:', error);
    process.exit(1);
  }
}

deploy();
