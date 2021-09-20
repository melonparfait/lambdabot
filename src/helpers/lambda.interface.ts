import { SlashCommandBuilder } from '@discordjs/builders';
import { Awaited, CommandInteraction, Interaction, Message, UserManager } from 'discord.js';
import { ClueManager } from '../clue-manager';
import { DBService } from '../db.service';
import { GameManager } from '../game-manager';
import { LambdaClient } from '../lambda-client';
import { Game } from '../models/game';

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
  execute: (interaction: CommandInteraction,
    gameManager?: GameManager,
    clueManager?: ClueManager,
    userManager?: UserManager,
    dbService?: DBService) => Awaited<any>
}

export type GamePhase = 'setup' | 'playing' | 'finished';
