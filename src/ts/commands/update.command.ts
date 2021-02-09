import { DiscordMessage } from '../helpers/lambda.interface';
import { owner_id } from '../../../keys.json';

export const name = 'update';
export const aliases = [];
export const cooldown = 1;
export const channelCooldown = false;
export const description = 'Updates the database';
export const guildOnly = false;
export const usage = '<SQL QUERY>';
export function execute(message: DiscordMessage, args: string[]) {
  if (message.author.id !== owner_id) {
    return message.channel.send('Sorry, you don\'t have permission to do that!');
  } else if (args[0].toUpperCase() !== 'INSERT') {
    return message.channel.send('This command can only be used to update the database.');
  }

  const query = args.join(' ');
  message.client.dbService.db.run(query, (err) => {
    if (err) {
      message.reply(`Error running SQL command: ${query}\n${err}`);
    } else {
      message.reply(`Successfully ran SQL command: ${query}.`);
    }
  });
}