import { DiscordMessage } from "../helpers/lambda.interface";

export const name = 'version';
export const aliases = ['v'];
export const cooldown = 5;
export const description = '';
export const guildOnly = false;
export const usage = ''
export function execute(message: DiscordMessage, args: string[]) {
    message.channel.send('λ-bot TypeScript');
}