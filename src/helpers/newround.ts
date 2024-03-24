import { bold, channelMention, userMention } from '@discordjs/builders';
import { User } from 'discord.js';
import { ClueManager } from '../services/clue-manager';
import { Game } from '../models/game';
import { clue } from './print.gameinfo';

export function createNewCluePrompt(game: Game, clueManager: ClueManager): void {
  game.currentClue = undefined;

  let clueIndex: number;
  do {
    clueIndex = clueManager.generateClueIndex();
  } while (game.playedClues.includes(clueIndex));

  game.addPlayedClue(clueIndex, clueManager.data.length);
  game.round.leftClue = clueManager.data[clueIndex].Lower;
  game.round.rightClue = clueManager.data[clueIndex].Higher;
}

export function clueGiverPrompt(game: Game): string {
  return bold(`Round ${game.roundsPlayed}:`)
    + '\nYou\'re the clue giver!\n'
    + clue(game.round, game.round.value)
    + `\nThe target number is: ${game.round.value}.`
    + `\nChannel link: ${channelMention(game.channelId)}`;
}

export function unableToDMClueGiver(clueGiver: User): string {
  return `${userMention(clueGiver.id)} was the clue giver, `
    + 'but I couldn\'t DM them with the prompt.';
}