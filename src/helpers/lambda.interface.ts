import { Awaitable, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, Client, ClientEvents, CommandInteraction, Events, InteractionResponse, Message, UserManager } from 'discord.js';
import { ClueManager } from '../services/clue-manager';
import { DBService } from '../services/db.service';
import { GameManager } from '../services/game-manager';
import { LambdaClient } from '../lambda-client';
import { Game } from '../models/game';
import { CooldownManager } from '../services/cooldown-manager';

export interface DiscordMessage extends Message {
  client: LambdaClient
}

export abstract class LambdabotCommand {
  /** Whether the command is restricted to only the Lamdabot admins */
  isRestricted: boolean;

  /** Time in seconds that this command needs to cooldown before it can be used again */
  cooldown?: number;

  /**
   * Whether the command has a channel-wide cooldown for every user or each user has their
   * own cooldown in the channel for the command
   */
  hasChannelCooldown: boolean;

  /** Whether the command can only be executed in guilds */
  isGuildOnly: boolean;

  /** The command metadata */
  data: SlashCommandBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'> | SlashCommandSubcommandsOnlyBuilder;

  lambdaClient: LambdaClient;
  gameManager: GameManager;
  clueManager: ClueManager;
  dbService: DBService;
  cooldownManager: CooldownManager;

  /** The function to run when the command is executed */
  abstract execute(interaction: ChatInputCommandInteraction): Awaitable<any>;

  setLambdaClient(client: LambdaClient) {
    this.lambdaClient = client;
    this.gameManager = client.gameManager;
    this.clueManager = client.clueManager;
    this.dbService = client.dbService;
    this.cooldownManager = client.cooldownManager;
  };
}

export enum EventTriggerType {
  once,
  on
}

export abstract class LambdabotEvent {
  name: keyof ClientEvents;
  eventTriggerType: EventTriggerType;
  lambdaClient: LambdaClient;
  abstract execute(...args: any): Awaitable<void>;
  setLambdaClient(client: LambdaClient) {
    this.lambdaClient = client;
  };
}

export type GamePhase = 'setup' | 'playing' | 'finished';
