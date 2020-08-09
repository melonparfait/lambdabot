import { DiscordMessage } from "../helpers/lambda.interface";
import { roster } from "../helpers/print.gameinfo";

export const name = 'maketeams';
export const aliases = ['teams'];
export const cooldown = 5;
export const description = 'Creates teams for the current game';
export const guildOnly = true;
export const args = true;
export const usage = '<\'random\'>';
export function execute(message: DiscordMessage, args: string[]) {
  const game = message.client.game;
  if (!game || game.status === 'finished') {
    return message.reply('No one has started a game yet. Use the \`newgame\` command to start one!');
  } else if (game.status === 'playing') {
    return message.channel.send('Sorry, teams cannot be created when a game is already in progress.');
  } else {
    game.resetTeams();
    switch(args[0]) {
      case 'random':
        game.assignRandomTeams();
        break;
      default:

    }
    return message.channel.send(roster(game));
  }
}