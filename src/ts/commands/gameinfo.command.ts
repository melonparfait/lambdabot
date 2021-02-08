import { DiscordMessage } from '../helpers/lambda.interface';
import { scoreboard, roundStatus, roster, gameSettings, currentClue, gameInfo } from '../helpers/print.gameinfo';

export const name = 'gameinfo';
export const aliases = ['info'];
export const cooldown = 5;
export const channelCooldown = true;
export const description = 'Posts information about the current game into chat';
export const guildOnly = true;
export const usage = '';
export const args = false;
export function execute(message: DiscordMessage, args: string[]) {
  const game = message.client.games.get(message.channel.id);
  if (!game) {
    return message.reply('No one has started a game yet. Use the `newgame` command to start one!');
  } else {
    return message.channel.send(gameInfo(game));
  }
}