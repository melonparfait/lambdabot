import { DiscordClient } from "../auth";
import { TextChannel } from "discord.js";
import { roundStatus, clue } from "./print.gameinfo";

export function sendNewRoundMessages(client: DiscordClient, channel: TextChannel) {
  const game = client.game;

  game.currentClue = undefined;

  const clueIndex = Math.floor(Math.random() * client.data.length);
  game.round.leftClue = client.data[clueIndex].Lower;
  game.round.rightClue = client.data[clueIndex].Higher;

  const user = client.users.cache.get(game.round.clueGiver);
  user.send(`\n**Round ${game.clueCounter + 1}:**`
    + '\nYou\'re the clue giver!\n'
    + clue(game.round, game.round.value)
    + `\nThe target number is: ${game.round.value}`)
      .then(() => channel.send(roundStatus(game)))
      .catch(error => {
        console.error(`Could not send the clue to ${user.tag}.\n`, error);
        channel.send(`<@${game.round.clueGiver}> was the clue giver, `
          + 'but I couldn\'t DM them. Do they have DMs disabled?');
    });
}