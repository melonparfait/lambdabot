import { sendNewRoundMessages } from "../helpers/newround";
import { DiscordMessage } from "../helpers/lambda.interface";
import { TextChannel } from "discord.js";
import { updateGameInfo } from "../helpers/print.gameinfo";

export const name = 'skip';
export const aliases = [];
export const cooldown = 5;
export const globalCooldown = true;
export const description = 'Gets a new clue';
export const guildOnly = true;
export const usage = ''
export function execute(message: DiscordMessage, args: string[]) {
    if (!message.client.game) {
      return message.channel.send('No one has started a game yet. Use the \`newgame\` command to start one!');
    } else if (message.client.game.status !== 'playing') { 
      return message.channel.send('The game is not currently in progress.');
    } else if (message.client.game.round.oGuess) {
      return message.reply('your team already made a guess, so you can\'t skip anymore!');
    } else {
      message.client.game.round.generateNewValue();
      updateGameInfo(message);
      return sendNewRoundMessages(message.client, message.channel as TextChannel);
    }
}
