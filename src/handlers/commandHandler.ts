import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { ExtendedClient } from '../client/ExtendedClient.js';
import type { Command, ButtonHandler, ModalHandler } from '../types/index.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Recursively get all .ts or .js files from a directory
 */
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;

  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      if ((file.endsWith('.ts') || file.endsWith('.js')) && !file.endsWith('.d.ts') && !file.endsWith('.map')) {
        arrayOfFiles.push(fullPath);
      }
    }
  }

  return arrayOfFiles;
}

/**
 * Load all commands, button handlers, and modal handlers dynamically
 */
export async function loadCommands(client?: ExtendedClient) {
  // Check both src/commands (development) and dist/commands (production)
  let commandsDir = path.resolve(__dirname, '../commands');
  if (!fs.existsSync(commandsDir)) {
    commandsDir = path.resolve(process.cwd(), 'src/commands');
  }

  const commandFiles = getAllFiles(commandsDir);
  const loadedCommands: Command[] = [];
  let buttonCount = 0;
  let modalCount = 0;

  for (const filePath of commandFiles) {
    try {
      const fileUrl = pathToFileURL(filePath).href;
      const module = await import(fileUrl);

      // Search through exported symbols in the module
      for (const [key, value] of Object.entries(module)) {
        if (!value || typeof value !== 'object') continue;

        // 1. Check if it's a Command
        if ('data' in value && 'execute' in value) {
          const cmd = value as Command;
          loadedCommands.push(cmd);
          if (client) {
            client.commands.set(cmd.data.name, cmd);
            logger.debug(`[CommandHandler] Registered command: /${cmd.data.name} (${path.basename(filePath)})`);
          }
        }

        // 2. Check if it's a ButtonHandler
        if ('customIdPrefix' in value && 'execute' in value && key.toLowerCase().includes('button')) {
          const btn = value as ButtonHandler;
          if (client) {
            client.buttons.set(btn.customIdPrefix, btn);
            buttonCount++;
            logger.debug(`[CommandHandler] Registered button handler: ${btn.customIdPrefix}`);
          }
        }

        // 3. Check if it's a ModalHandler
        if ('customIdPrefix' in value && 'execute' in value && key.toLowerCase().includes('modal')) {
          const mdl = value as ModalHandler;
          if (client) {
            client.modals.set(mdl.customIdPrefix, mdl);
            modalCount++;
            logger.debug(`[CommandHandler] Registered modal handler: ${mdl.customIdPrefix}`);
          }
        }
      }
    } catch (err) {
      logger.error(`[CommandHandler] Failed to load module at ${filePath}:`, err);
    }
  }

  if (client) {
    logger.success(
      `📦 [CommandHandler] Loaded ${client.commands.size} slash commands, ${buttonCount} button handlers, and ${modalCount} modal handlers.`
    );
  }

  return loadedCommands;
}
