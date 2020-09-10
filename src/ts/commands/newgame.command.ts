import { Game } from '../models/game';
import { DiscordMessage } from '../helpers/lambda.interface';
import { gameSettings, roster, roundStatus, gameInfo } from '../helpers/print.gameinfo';

export const name = 'newgame';
export const aliases = ['new', 'ng'];
export const cooldown = 5;
export const description = 'Starts a new game of Wavelength';
export const guildOnly = true;
export const usage = ''
export function execute(message: DiscordMessage, args: string[]) {
  const existingGame = message.client.game;
  if (existingGame && (existingGame.status === 'setup'
      || existingGame.status === 'playing')) {
    return message.reply('it looks like there\'s already a game running.');
  } else {
    if (existingGame) {
      message.client.game = new Game({
        threshold: existingGame.threshold,
        asyncPlay: existingGame.asyncPlay,
        oGuessTime: 180 * 1000,
        dGuessTime: existingGame.dGuessTime
      });
    } else {
      message.client.game = new Game();
    }

    const newGame = message.client.game;
    newGame.join(message.author.id);
    message.channel.send(gameInfo(newGame)).then(() => {
      message.channel.lastMessage.pin()
        .then(msg => newGame.pinnedInfo = msg)
        .catch(err => {
          message.channel.send('I couldn\'t pin the game info to this channel. Do I have permission to manage messages on this channel?');
          console.log(err);
      });
    });

    return message.reply(`started a new Wavelength game! Use \`join\` to get in!`);
  }
}