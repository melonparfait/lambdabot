import { CommandInteraction, TextChannel, UserManager } from 'discord.js';
import { ClueManager } from '../clue-manager';
import { Game } from '../models/game';
import { roundStatus, clue, gameSettings, roster, gameInfo } from './print.gameinfo';

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

  const user = userManager.cache.get(game.round.clueGiver);
  try {
    await user.send(`\n**Round ${game.roundCounter + 1}:**`
      + '\nYou\'re the clue giver!\n'
      + clue(game.round, game.round.value)
      + `\nThe target number is: ${game.round.value}`);

    await game.pinnedInfo.edit(gameInfo(game))
      .catch(err => {
        interaction.channel.send('I couldn\'t edit the pinned game info on this channel. Do I have permission to manage messages on this channel?');
        console.log(err);
    });
    return(roundStatus(game));
  } catch (error) {
    console.error(`Could not send the clue to ${user.tag}.\n`, error);
    interaction.channel.send(`<@${game.round.clueGiver}> was the clue giver, `
      + 'but I couldn\'t DM them. Do they have DMs disabled?');
  }
}

export function getClueIndex(data: any) {
  return Math.floor(Math.random() * data.length);
}