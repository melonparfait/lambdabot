import { Awaited, Interaction, Message } from 'discord.js';
import { LambdaClient } from '../discord.service';

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
  cooldown: number,
  channelCooldown: boolean,
  description: string,
  guildOnly: boolean,
  usage: string,
  args: boolean,
  data: {
    name: string
  }
  execute: (interaction: Interaction) => Awaited<any>
}

export type GamePhase = 'setup' | 'playing' | 'finished';
