import { sendNewRoundMessages } from "../helpers/newround";

export const name = 'skip';
export const aliases = [];
export const cooldown = 5;
export const description = 'Gets a new clue';
export const guildOnly = true;
export const usage = ''
export function execute(message, args) {
    if (!message.client.game) {
        return message.channel.send('No one has started a game yet. Use the \`newgame\` command to start one!');
    } else if (message.client.game.status !== 'playing') { 
        return message.channel.send('The game is not currently in progress.');
    } else {
        message.client.game.round.generateNewValue();
        sendNewRoundMessages(message.client, message.channel);
    }
