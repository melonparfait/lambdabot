import { TextChannel } from 'discord.js';
import { LambdaClient } from '../discord.service';
import { roundStatus, clue, gameSettings, roster, gameInfo } from './print.gameinfo';

export function sendNewRoundMessages(client: LambdaClient, channel: TextChannel) {
  const game = client.games.get(channel.id);

  game.currentClue = undefined;

  let clueIndex = getClueIndex(client.data);
  if (game.playedClues.includes(clueIndex)) {
    clueIndex = getClueIndex(client.data);
  }
  game.addPlayedClue(clueIndex, client.data.length);

  game.round.leftClue = client.data[clueIndex].Lower;
  game.round.rightClue = client.data[clueIndex].Higher;

  const user = client.users.cache.get(game.round.clueGiver);
  user.send(`\n**Round ${game.roundCounter + 1}:**`
      + '\nYou\'re the clue giver!\n'
      + clue(game.round, game.round.value)
      + `\nThe target number is: ${game.round.value}`)
    .then(() => {
      const roundText = roundStatus(game);
      channel.send(roundText);
      game.pinnedInfo.edit(gameInfo(game))
        .catch(err => {
          channel.send('I couldn\'t edit the pinned game info on this channel. Do I have permission to manage messages on this channel?');
          console.log(err);
        });
    })
    .catch(error => {
      console.error(`Could not send the clue to ${user.tag}.\n`, error);
      channel.send(`<@${game.round.clueGiver}> was the clue giver, `
        + 'but I couldn\'t DM them. Do they have DMs disabled?');
    });
}

export function getClueIndex(data: any) {
  return Math.floor(Math.random() * data.length);
}