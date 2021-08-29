import { SlashCommandBuilder } from '@discordjs/builders';
import { Awaited, CommandInteraction, Interaction, Message } from 'discord.js';
import { LambdaClient } from '../lambda-client';

export interface DiscordMessage extends Message {
  client: LambdaClient
}

export interface Command {
  /** Whether the command is restricted to only the Lamdabot admins */
  isRestricted: boolean,

  /** Time in seconds that this command needs to cooldown before it can be used again */
  cooldown?: number,

  /**
   * Whether the command has a channel-wide cooldown for every user or each user has their
   * own cooldown in the channel for the command
   */
  hasChannelCooldown: boolean,

  /** Whether the command can only be executed in guilds */
  isGuildOnly: boolean,

  /** The command metadata */
  data: SlashCommandBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>,

  /** The function to run when the command is executed */
  execute: (interaction: CommandInteraction) => Awaited<void>
}

export type GamePhase = 'setup' | 'playing' | 'finished';
