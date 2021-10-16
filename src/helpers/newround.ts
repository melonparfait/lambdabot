import { userMention } from '@discordjs/builders';
import { CommandInteraction, TextChannel, UserManager } from 'discord.js';
import { ClueManager } from '../clue-manager';
import { Game } from '../models/game';
import { roundStatus, clue, gameSettings, roster, gameInfo, couldNotPin } from './print.gameinfo';

export async function sendNewRoundMessages(interaction: CommandInteraction,
    game: Game, clueManager: ClueManager, userManager: UserManager) {
  game.currentClue = undefined;

  let clueIndex = getClueIndex(clueManager.data);
  if (game.playedClues.includes(clueIndex)) {
    clueIndex = getClueIndex(clueManager.data);
  }
  game.addPlayedClue(clueIndex, clueManager.data.length);
  game.round.leftClue = clueManager.data[clueIndex].Lower;
  game.round.rightClue = clueManager.data[clueIndex].Higher;

  const user = await userManager.fetch(game.round.clueGiver);

  try {
    await user.send(`\n**Round ${game.roundCounter + 1}:**`
      + '\nYou\'re the clue giver!\n'
      + clue(game.round, game.round.value)
      + `\nThe target number is: ${game.round.value}`);
  } catch (error) {
    console.error(`Could not send the clue to ${user.tag}.\n`, error);
    return `${userMention(game.round.clueGiver)} was the clue giver, `
      + 'but I couldn\'t DM them. Do they have DMs disabled?';
  }

  try {
    await game.pinnedInfo.edit(gameInfo(game));
    return(roundStatus(game));
  } catch (err) {
    console.log(err);
    return couldNotPin;
  }
}

export function getClueIndex(data: any) {
  return Math.floor(Math.random() * data.length);
}