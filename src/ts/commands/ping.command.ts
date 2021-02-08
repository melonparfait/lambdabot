import { DiscordMessage } from '../helpers/lambda.interface';

export const name = 'ping';
export const aliases = [];
export const cooldown = 5;
export const channelCooldown = true;
export const description = 'Ping!';
export const guildOnly = true;
export const args = false;
export function execute(message: DiscordMessage, args: string[]) {
  message.channel.send('Pong?');
}