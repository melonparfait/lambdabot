import { Game } from '../models/game';
import { DiscordMessage } from '../helpers/lambda.interface';
import { gameSettings, roster, roundStatus } from '../helpers/print.gameinfo';

export const name = 'newgame';
export const aliases = ['new', 'ng'];
export const cooldown = 5;
export const description = 'Starts a new game of Wavelength';
export const guildOnly = true;
export const usage = ''
export function execute(message: DiscordMessage, args: string[]) {
  let game = message.client.game;
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
      game = message.client.game;
    }

    message.client.game.join(message.author.id);
    message.channel.send(gameSettings(game) 
        + '\n' + roster(game)).then(() => {
      message.channel.lastMessage.pin()
        .then(msg => game.pinnedInfo = msg)
        .catch(err => {
          message.channel.send('I couldn\'t pin the game info to this channel. Do I have permission to manage messages on this channel?');
          console.log(err);
      });
    });

    return message.reply(`started a new Wavelength game! Use \`join\` to get in!`);
  }
}