import { REST, Routes } from 'discord.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { loadCommands } from './handlers/commandHandler.js';

const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

async function deploy() {
  try {
    logger.info('📦 Dynamically discovering application commands...');
    const commandsList = await loadCommands();
    const commandPayloads = commandsList.map((cmd) => cmd.data.toJSON());

    logger.info(`Started refreshing ${commandPayloads.length} application (/) commands...`);

    if (env.DISCORD_DEV_GUILD_ID) {
      logger.info(`Deploying commands directly to DEV GUILD: ${env.DISCORD_DEV_GUILD_ID}`);
      const data: any = await rest.put(
        Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_DEV_GUILD_ID),
        { body: commandPayloads }
      );
      logger.success(`Successfully reloaded ${data.length} guild (/) commands!`);
    } else {
      logger.info('Deploying commands GLOBALLY across all Discord guilds...');
      const data: any = await rest.put(
        Routes.applicationCommands(env.DISCORD_CLIENT_ID),
        { body: commandPayloads }
      );
      logger.success(`Successfully reloaded ${data.length} global (/) commands!`);
    }
  } catch (error) {
    logger.error('Failed to deploy application commands:', error);
    process.exit(1);
  }
}

deploy();
