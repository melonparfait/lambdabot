import { DiscordMessage } from "../helpers/lambda.interface";
import { scoreboard, roundStatus, roster, gameSettings } from "../helpers/print.gameinfo";

export const name = 'gameinfo';
export const aliases = ['info'];
export const cooldown = 5;
export const description = 'Posts information about the current game into chat';
export const guildOnly = true;
export const usage = '';
export const args = false;
export function execute(message: DiscordMessage, args: string[]) {
  if (!message.client.game) {
    return message.reply('No one has started a game yet. Use the \`newgame\` command to start one!');
  } else {
    const game = message.client.game;
    let response =  `**Game Status**: ${game.status}\n`;
    switch(game.status) {
      case 'setup':
        response += (gameSettings(game) + '\n' + roster(game));
        break;
      case 'playing':
        response += (roundStatus(game) + '\n' + scoreboard(game));
        break;
      default:
        response += scoreboard(game);
    }
    return message.channel.send(response);
  }
}