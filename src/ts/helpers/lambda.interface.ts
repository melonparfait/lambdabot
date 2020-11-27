import { Message } from 'discord.js';
import { DiscordService } from '../auth';

export interface DiscordMessage extends Message {
  client: DiscordService
}

export interface Command {
  name: string,
  aliases: any[],
  cooldown: number,
  globalCooldown: boolean,
  description: string,
  guildOnly: boolean,
  usage: string,
  args: boolean,
  execute: (message: DiscordMessage, args: string[]) => void
}

export type GamePhase = 'setup' | 'playing' | 'finished';
