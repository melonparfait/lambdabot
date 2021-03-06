import { DiscordMessage } from '../helpers/lambda.interface';

export const name = 'quit';
export const aliases = ['stop'];
export const cooldown = 5;
export const description = 'Stops the current game';
export const guildOnly = true;
export const usage = '';
export function execute(message: DiscordMessage, args: string[]) {
  const game = message.client.games.get(message.channel.id);
  if (!game) {
    return message.channel.send('No one has started a game yet. Use the `newgame` command to start one!');
  } else {
    game.endGame();
    message.client.finalizeGame(message.channel.id, false);
    game.pinnedInfo.unpin()
      .catch(err => {
        message.channel.send('I couldn\'t unpin the game info to this channel. Do I have permission to manage messages on this channel?');
        console.log(err);
      });

    return message.channel.send('I stopped the current game.');
  }
}
