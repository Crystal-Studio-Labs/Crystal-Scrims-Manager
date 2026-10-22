import type { 
  ChatInputCommandInteraction, 
  SlashCommandBuilder, 
  SlashCommandSubcommandsOnlyBuilder,
  SlashCommandOptionsOnlyBuilder,
  AutocompleteInteraction,
  ButtonInteraction,
  ModalSubmitInteraction
} from 'discord.js';
import type { ExtendedClient } from '../client/ExtendedClient.js';

export interface Command {
  data: 
    | SlashCommandBuilder 
    | SlashCommandSubcommandsOnlyBuilder 
    | SlashCommandOptionsOnlyBuilder 
    | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
  execute: (interaction: ChatInputCommandInteraction, client: ExtendedClient) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction, client: ExtendedClient) => Promise<void>;
}

export interface ButtonHandler {
  customIdPrefix: string;
  execute: (interaction: ButtonInteraction, client: ExtendedClient) => Promise<void>;
}

export interface ModalHandler {
  customIdPrefix: string;
  execute: (interaction: ModalSubmitInteraction, client: ExtendedClient) => Promise<void>;
}

export interface Event {
  name: string;
  once?: boolean;
  execute: (client: ExtendedClient, ...args: any[]) => Promise<void> | void;
}
