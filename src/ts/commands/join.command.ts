import { DiscordMessage } from '../helpers/lambda.interface';
import { remove } from 'lodash';
import { gameSettings, roster, updateGameInfo } from '../helpers/print.gameinfo';

export const name = 'join';
export const aliases = [];
export const cooldown = 5;
export const description = 'Joins the current game. If a team number argument is provided, joins that team.';
export const guildOnly = true;
export const usage = '[team number]';
export function execute(message: DiscordMessage, args: string[]) {
  const game = message.client.games.get(message.channel.id);
  if (!game || game.status === 'finished') {
    return message.reply('No one has started a game yet. Use the `newgame` command to start one!');
  } else if (game.status !== 'setup') {
    return message.reply('Sorry, it looks like the game is already running.');
    // TODO: allow joining an in-progress game
  } else if (args.length === 1) {
    const parseResult = parseInt(args[0]);
    if (isNaN(parseResult) || (parseResult !== 1 && parseResult !== 2)) {
      return message.reply('try again with `!join 1` or `!join 2`.');
    } else {
      let response: string;
      if (game.join(message.author.id)) {
        response = `${message.author} joined the game on team `;
      } else {
        if (game.team1.players.includes(message.author.id)) {
          remove(game.team1.players, player => player === message.author.id);
        }
        if (game.team2.players.includes(message.author.id)) {
          remove(game.team2.players, player => player === message.author.id);
        }
        response = `${message.author} joined team `;
      }
      if (parseResult === 1) {
        game.team1.players.push(message.author.id);
        response += '1.';
      } else {
        game.team2.players.push(message.author.id);
        response += '2.';
      }
      updateGameInfo(message);
      return message.channel.send(response);
    }
  } else if (game.join(message.author.id)) {
    updateGameInfo(message);
    return message.channel.send(`${message.author} joined the game!`);
  } else {
    return message.channel.send(`${message.author} is already in the game.`);
  }
}