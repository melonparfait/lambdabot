import { DiscordMessage } from '../helpers/lambda.interface';
import { bot_prefix } from '../../../config.json';
import { DBService } from '../db.service';
import { stat } from 'fs';
import { PlayerStats, printStats } from '../helpers/print.stats';
import { isUndefined } from 'lodash';

export const name = 'stats';
export const aliases = [];
export const cooldown = 1;
export const channelCooldown = false;
export const description = 'Reports stats for a player';
export const guildOnly = false;
export const usage = '[global] [player]';
export function execute(message: DiscordMessage, args: string[]) {
  let player: string;
  let channel: string;

  switch (args.length) {
  case 0:
    player = message.author.id;
    channel = message.channel.id;
    sendStats(message, player, channel);
    break;
  case 1:
    if (args[0] === 'global') {
      player = message.author.id;
      sendStats(message, player);
    } else {
      const id = args[0].replace(/^<@!?(.+)>$/g, '$1');
      message.client.users.fetch(id).then(user => {
        player = user.id;
        channel = message.channel.id;
        sendStats(message, player, channel);
      }).catch(err => {
        console.log(err);
        message.reply(`${args[0]} is not a valid Discord user.`);
      });
    }
    break;
  case 2:
    if (args[0] !== 'global') {
      message.reply(`that's not the correct usage for this command. Try again with this format:\n \`${bot_prefix}${name} ${usage}\``);
      return;
    } else {
      const id = args[1].replace(/^<@!?(.+)>$/g, '$1');
      message.client.users.fetch(id).then(user => {
        player = user.id;
        sendStats(message, player);
      }).catch(err => {
        console.log(err);
        message.reply(`${args[0]} is not a valid Discord user.`);
      });
    }
    break;
  default:
    message.reply(`you gave too many arguments!\
      \nTry again with this format:\n \`${bot_prefix}${name} ${usage}\``);
    return;
  }
}

function sendStats(message: DiscordMessage, player: string, channel?: string) {
  message.client.dbService.getPlayerStats(player, channel).then(stats => {
    message.channel.send(printStats(stats, !isUndefined(channel)), { allowedMentions: {} });
  });
}
