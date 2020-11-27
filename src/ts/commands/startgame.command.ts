import { sendNewRoundMessages } from '../helpers/newround';
import { DiscordMessage } from '../helpers/lambda.interface';
import { TextChannel } from 'discord.js';
import { gameSettings, roster } from '../helpers/print.gameinfo';

export const name = 'startgame';
export const aliases = ['start'];
export const cooldown = 5;
export const description = 'Starts the game using the current teams';
export const guildOnly = true;
export const usage = '';
export function execute(message: DiscordMessage, args: string[]) {
  const game = message.client.game;
  if (!game) {
    return message.channel.send('No one has started a game yet. Use the `newgame` command to start one!');
  } else if (game.status === 'playing') {
    return message.channel.send('The game is already in progress.');
  } else {
    const teamCheckReply = 'We need at least 2 players on each team to start a game.';
    const team1NeedsMorePlayers = game.team1.players.length < 2 ?
      `Team 1 has ${game.team1.players.length} players.` : false;
    const team2NeedsMorePlayers = game.team2.players.length < 2 ?
      `Team 2 has ${game.team2.players.length} players.` : false;
    if (team1NeedsMorePlayers || team2NeedsMorePlayers) {
      return message.channel.send(teamCheckReply
        + `\n${team1NeedsMorePlayers}`
        + `\n${team2NeedsMorePlayers}`);
    } else {
      game.start();
      sendNewRoundMessages(message.client, message.channel as TextChannel);
    }
  }
}
