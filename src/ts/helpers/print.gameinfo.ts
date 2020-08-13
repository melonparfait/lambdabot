import { Game } from "../models/game";
import { Round } from "../models/round";
import { TextChannel } from "discord.js";

export function roundStatus(game: Game): string {
  return `Round: ${game.clueCounter + 1}`
    + `\nTeam ${game.guessingTeam()} guesses.`
    + `\n<@${game.round.clueGiver}> is the clue giver.`
    + `\n${clue(game.round)}`;
}

export function gameSettings(game: Game): string {
  const asyncLabel = game.asyncPlay ? 'enabled' : 'disabled';
  const counterGuess = !game.asyncPlay ? `\n├─ Counter guess timer: ${game.dGuessTime / 1000}` : '';
  return '**Settings**'
    + `\n├─ Points to win: ${game.threshold}`
    + counterGuess
    + `\n└─ Asynchronous play: ${asyncLabel}`;
}

export function spectrumBar(target?: number): string {
  let spectrumBar = '='.repeat(25);
  if (target) {
    const marker = Math.floor(target / 4);
    spectrumBar = spectrumBar.substring(0, marker) + `[${target}]`
      + spectrumBar.substring(marker, spectrumBar.length - 1);
  }
  return spectrumBar;
}

export function clue(round: Round, guess?: number): string {
  return 'The clue is:'
  + `\n${round.leftClue} 0 [${spectrumBar(guess)}] 100 ${round.rightClue}`;
  + `\n├─ Lower: ${round.leftClue}`
  + `\n└─ Higher: ${round.rightClue}`
}

export function sendGameEndScoreboard(channel: TextChannel, game: Game) {
  channel.send(game.winner + ' has won the game!'
    + '\nFinal stats:'
    + `\nRounds played: ${game.clueCounter}` + '\n'
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

  return '**Roster**'
    + '\nTeam 1'
    + `\n└─ Players: ${team1Players}`
    + '\nTeam 2'
    + `\n└─ Players: ${team2Players}`;
}