import { Game } from "../models/game";
import { Round } from "../models/round";

export function roundStatus(game: Game): string {
  return `Round: ${game.clueCounter + 1}`
    + `\nTeam ${game.guessingTeam()} guesses.`
    + `\n<@${game.round.clueGiver}> is the clue giver.`
}

export function gameSettings(game: Game): string {
  const asyncLabel = game.asyncPlay ? 'enabled' : 'disabled';
  const counterGuess = game.asyncPlay ? `\n├─ Counter guess timer: ${game.dGuessTime / 1000}` : '';
  return '**Settings**'
    + `\n├─ Points to win: ${game.threshold}`
    + counterGuess
    + `\n└─ Asynchronous play: ${asyncLabel}`;
}

export function clue(round: Round): String {
  return 'The clue is:'
  + `\n├─ Lower: ${round.leftClue}`
  + `\n└─ Higher: ${round.rightClue}`
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