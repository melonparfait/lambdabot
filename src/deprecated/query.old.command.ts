import { DiscordMessage } from '../helpers/lambda.interface';
import { owner_id } from '../../keys.json';

export const name = 'query';
export const aliases = [];
export const cooldown = 1;
export const channelCooldown = false;
export const description = 'Queries the database';
export const guildOnly = false;
export const usage = '<SQL QUERY>';
export function execute(message: DiscordMessage, args: string[]) {
  if (message.author.id !== owner_id) {
    return message.channel.send('Sorry, you don\'t have permission to do that!');
  } else if (args[0].toUpperCase() !== 'SELECT') {
    return message.channel.send('This command can only be used to query the database.');
  }

  const query = args.join(' ');
  message.client.dbService.db.all(query, (err, rows) => {
    if (err) {
      return message.reply(`Error running SQL command: ${query}\n${err}`);
    } else {
      if (rows.length === 0) {
        return message.reply(`No rows returned for query: ${query}`);
      }

      let msg = Object.keys(rows[0]).reduce((prev, curr) => `${prev}\`${curr}\` | `, '');
      msg = msg.slice(0, msg.length - 3);
      msg += '\n';
      rows.forEach(row => {
        Object.keys(row).forEach(key => msg += `${row[key]} | `);
        msg = msg.slice(0, msg.length - 3);
        msg += '\n';
      });
      try {
        message.channel.send(msg);
      } catch (err) {
        message.reply(`There was an error reporting the results through Discord: ${err}`);
      }
    }
  });
}