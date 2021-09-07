import { Game } from '../models/game';
import { Round } from '../models/round';
import { TextChannel, Message, Channel, TextBasedChannels } from 'discord.js';
import { DiscordMessage } from './lambda.interface';
import { GameManager } from '../game-manager';

export const noActiveGameMessage = {
  content: 'No one has started a game yet. Use the `/newgame` command to start one!',
  ephemeral: true
};

export function roundStatus(game: Game): string {
  return `**Round: ${game.roundCounter + 1}**`
    + `\nTeam ${game.offenseTeamNumber()} guesses.`
    + `\n<@${game.round.clueGiver}> is the clue giver.`
    + `\n${clue(game.round)}`;
}

export function gameSettings(game: Game): string {
  const threshold = game.isDefaultThreshold ? 'default' : game.threshold;
  const asyncLabel = game.asyncPlay ? 'enabled' : 'disabled';
  const trackStats = game.trackStats ? 'on' : 'off';
  const counterGuess = !game.asyncPlay ? `\n├─ Counter guess timer: ${game.dGuessTime / 1000}` : '';
  return '**Settings**'
    + `\n├─ Points to win: ${threshold}`
    + counterGuess
    + `\n├─ Track stats: ${trackStats}`
    + `\n└─ Asynchronous play: ${asyncLabel}`;
}

export function spectrumBar(target?: number, side?: 'higher' | 'lower'): string {
  const length = 25;
  let spectrumBar = '='.repeat(length);
  if (target) {
    const marker = Math.floor(target / 4);
    const leftSide = side === 'lower'
      ? '<'.repeat(marker)
      : spectrumBar.substring(0, marker);
    const rightSide = side === 'higher'
      ? '>'.repeat(length - marker - 1)
      : spectrumBar.substring(marker, spectrumBar.length - 1);
    spectrumBar = leftSide + `[${target}]` + rightSide;
  }
  return spectrumBar;
}

export function clue(round: Round, guess?: number): string {
  return 'The clue is:'
  + `\n${round.leftClue} 0 [${spectrumBar(guess)}] 100 ${round.rightClue}`;
}

export function currentClue(game: Game): string {
  if (game.currentClue) {
    return `<@${game.clueGiver()}> gave this clue: ${game.currentClue}`;
  } else {
    return undefined;
  }
}

export function sendGameEndScoreboard(channel: TextChannel, game: Game, winner: string) {
  channel.send(winner + ' has won the game!'
    + '\nFinal stats:'
    + `\nRounds played: ${game.roundCounter}` + '\n'
    + scoreboard(game));
}

export function scoreboard(game: Game): string {
  return '**Scoreboard**'
    + '\nTeam 1'
    + `\n├─ Players: ${game.team1.players.map(id => `<@${id}>`).join(', ')}`
    + `\n└─ Points: ${game.team1.points}`
    + '\nTeam 2'
    + `\n├─ Players: ${game.team2.players.map(id => `<@${id}>`).join(', ')}`
    + `\n└─ Points: ${game.team2.points}`;
}

export function roster(game: Game): string {
  const team1Players = game.team1.players.length
    ? game.team1.players.map(id => `<@${id}>`).join(', ')
    : 'No one is currently on Team 1.';
  const team2Players = game.team2.players.length
    ? game.team2.players.map(id => `<@${id}>`).join(', ')
    : 'No one is currently on Team 2.';

  let output = '**Roster**'
    + '\nTeam 1'
    + `\n└─ Players: ${team1Players}`
    + '\nTeam 2'
    + `\n└─ Players: ${team2Players}`;

  const unassigned = game.unassignedPlayers;
  if (unassigned.length) {
    output += `\nUnassigned\n└─ Players: ${unassigned.map(id => `<@${id}>`).join(', ')}`;
  }

  return output;
}

export function gameInfo(game: Game): string {
  let response = `**Game Status**: ${game.status}\n`;
  switch(game.status) {
    case 'setup':
      response += (gameSettings(game) + '\n' + roster(game));
      break;
    case 'playing':
      response += (gameSettings(game) + '\n' + roundStatus(game));
      if (game.currentClue) {
        response += ('\n' + currentClue(game));
      }
      response += ('\n' + scoreboard(game));
      break;
    default:
      response += scoreboard(game);
  }
  return response;
}

export async function updateGameInfo(channel: TextBasedChannels, gameManager: GameManager) {
  const game = gameManager.getGame(channel.id);
  if (game.pinnedInfo) {
    try {
      await game.pinnedInfo.edit(gameInfo(game));
    } catch (err) {
      console.log(err);
      channel.send('I couldn\'t pin the game info to this channel. Do I have permission to manage messages on this channel?');
    }
  } else {
    await channel.send(gameInfo(game));
    try {
      const msg = await channel.lastMessage.pin();
      game.pinnedInfo = msg;
    } catch (err) {
      console.log(err);
      channel.send('I couldn\'t pin the game info to this channel. Do I have permission to manage messages on this channel?');
    }
  }
}
