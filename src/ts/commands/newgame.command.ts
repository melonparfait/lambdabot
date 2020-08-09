import { Game } from '../models/game';
import { DiscordMessage } from '../helpers/lambda.interface';

export const name = 'newgame';
export const aliases = ['new', 'ng'];
export const cooldown = 5;
export const description = 'Starts a new game of Wavelength';
export const guildOnly = true;
export const usage = ''
export function execute(message: DiscordMessage, args: string[]) {
  const game = message.client.game;
  if (game && (game.status === 'setup'
      || game.status === 'playing')) {
    return message.reply('it looks like there\'s already a game running.');
  } else {
    if (game) {
      message.client.game = new Game({
        threshold: game.threshold,
        asyncPlay: game.asyncPlay,
        oGuessTime: 180 * 1000,
        dGuessTime: game.dGuessTime
      });
    } else {
      message.client.game = new Game();
    }
    message.client.game.join(message.author.id);
    return message.reply(`started a new Wavelength game! Use \`join\` to get in!`);
  }
}