import { DiscordMessage } from '../helpers/lambda.interface';
import { owner_id } from '../../../keys.json';

export const name = 'updateclues';
export const aliases = [];
export const cooldown = 1;
export const channelCooldown = true;
export const description = 'Updates the list of clues ';
export const guildOnly = false;
export const usage = '';
export function execute(message: DiscordMessage, args: string[]) {
  if (message.author.id !== owner_id) {
    return message.channel.send('Sorry, you don\'t have permission to do that!');
  } else {
    message.client.loadClues();
    return message.channel.send('Successfully reloaded clues!');
  }
}