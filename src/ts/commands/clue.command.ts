import { DiscordMessage } from "../helpers/lambda.interface";
import { checkForGame, checkGamePhase } from "../helpers/command.errorchecks";
import { currentClue } from "../helpers/print.gameinfo";

export const name = 'clue';
export const aliases = ['giveclue', 'c'];
export const cooldown = 5;
export const description = 'Ping!';
export const guildOnly = true;
export const args = true;
export function execute(message: DiscordMessage, args: string[]) {
  const game = message.client.game;
  if (!checkForGame(message)) { return }
  else if (!checkGamePhase(game, 'playing')) {
    return message.reply('it looks like the game isn\'t in progress yet.');
  } else if (message.author.id !== game.clueGiver()) {
    return message.reply('only the clue giver can use this command!');
  } else {
    game.currentClue = args.join(' ');
    const clueMsg = currentClue(game);
    game.pinnedInfo.edit(game.pinnedInfo.content 
        + '\n' + clueMsg)
      .catch(err => {
        message.channel.send('I couldn\'t edit the pinned game info on this channel. Do I have permission to manage messages on this channel?');
        console.log(err);
    });
    return message.channel.send(clueMsg
      + ` ${game.offenseTeam().players
          .filter(id => id !== message.author.id)
          .map(id => `<@${id}>`).join(', ')}`);
  }
}