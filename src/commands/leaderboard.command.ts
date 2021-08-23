import { bot_prefix } from '../../../config.json';
import { DiscordMessage } from '../helpers/lambda.interface';
import { printLeaderboard, trimLeaderboard } from '../helpers/print.leaderboard';
import { PlayerStats } from '../helpers/print.stats';

export const name = 'leaderboard';
export const aliases = ['l'];
export const cooldown = 1;
export const channelCooldown = true;
export const description = 'Reports the leaderboard for this channel. Accepts the following arguments:\n\
  `wins`: Number of times player has been on the winning side of a game\n\
  `win%`: Win/Loss ratio for the player\n\
  `avg`: Average number of points the player scores for their team when they are a clue giver\n\
  `perfect`: Number of times player has given a clue that their team guessed perfectly';
export const guildOnly = true;
export const usage = '<`\'wins\'` | `\'win%\'` | `\'avg\'` | `\'perfect\'`>';
export function execute(message: DiscordMessage, args: string[]) {
  if (args.length !== 1) {
    message.reply(`I couldn't understand that - can you try formatting your command like this? \`${bot_prefix}${name}\` ${usage}`);
    return;
  } else if (!['wins', 'win%', 'avg', 'perfect'].includes(args[0])) {
    message.reply('I am only tracking leaderboards for `wins`, `win%`, `avg`, and `perfect`.');
    return;
  }
  message.client.dbService.getChannelPlayers(message.channel.id).then(players => {
    const statQuery: Promise<PlayerStats>[] = [];
    players.forEach(player => {
      statQuery.push(message.client.dbService.getPlayerStats(player, message.channel.id));
    });
    Promise.all(statQuery).then(playerStats => {
      if (playerStats.length === 0) {
        return message.reply('no games with tracked stats have been played yet on this channel. Start a new one with `!newgame`.');
      }
      let msg = printLeaderboard(playerStats, args[0]);
      while (msg.length > 2000) {
        msg = trimLeaderboard(msg);
      }
      message.channel.send({ content: msg, allowedMentions: {} })
        .catch(err => message.reply(`There was an error running that command: ${err}`));
    }).catch(err => console.log(`Failed to get player stats: ${err}`));
  }).catch(err => console.log(`Failed to get channel players: ${err}`));
}