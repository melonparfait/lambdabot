import { SlashCommandBuilder } from '@discordjs/builders';
import { Awaited, CommandInteraction, Interaction, Message } from 'discord.js';
import { LambdaClient } from '../lambda-client';

export interface DiscordMessage extends Message {
  client: LambdaClient
}

export interface Command {
  name: string,
  aliases: any[],
  cooldown: number,
  channelCooldown: boolean,
  description: string,
  guildOnly: boolean,
  usage: string,
  args: boolean,
  execute: (message: DiscordMessage, args: string[]) => void
}

export interface NewCommand {
  name: string,
  aliases: any[],
  cooldown?: number,
  channelCooldown: boolean,
  description: string,
  guildOnly: boolean,
  usage: string,
  args: boolean,
  data: SlashCommandBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>,
  execute: (interaction: CommandInteraction) => Awaited<void>
}

export type GamePhase = 'setup' | 'playing' | 'finished';
