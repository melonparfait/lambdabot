import { DiscordMessage } from "../helpers/lambda.interface";

export const name = 'echo';
export const aliases = [];
export const cooldown = 1;
export const globalCooldown = true;
export const description = 'Echo!';
export const guildOnly = false;
export const usage = '<text>';
export const args = true;
export function execute(message: DiscordMessage, args: string[]) {
  message.channel.send(args);
}