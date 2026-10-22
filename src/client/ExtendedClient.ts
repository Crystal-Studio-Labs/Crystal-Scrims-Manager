import { 
  Client, 
  Collection, 
  GatewayIntentBits, 
  Partials 
} from 'discord.js';
import type { Command, ButtonHandler, ModalHandler } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { db } from '../db/index.js';
import { loadCommands, loadEvents } from '../handlers/index.js';

export class ExtendedClient extends Client {
  public commands: Collection<string, Command> = new Collection();
  public buttons: Collection<string, ButtonHandler> = new Collection();
  public modals: Collection<string, ModalHandler> = new Collection();
  public db = db;

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
      ],
      partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User,
        Partials.GuildMember,
      ],
    });
  }

  /**
   * Automatically load all commands, components, and event listeners
   */
  public async loadHandlers() {
    logger.info('⚙️ Loading commands and events dynamically...');
    await loadCommands(this);
    await loadEvents(this);
  }

  /**
   * Connect to the Discord Gateway
   */
  public async init(token: string) {
    try {
      await this.loadHandlers();
      logger.info('🚀 Logging in to Discord Gateway...');
      await this.login(token);
    } catch (error) {
      logger.error('Failed to login to Discord Gateway:', error);
      process.exit(1);
    }
  }
}
