import { sendNewRoundMessages } from "../helpers/newround";

export const name = 'startgame';
export const aliases = ['start'];
export const cooldown = 5;
export const description = 'Starts the game using the current teams';
export const guildOnly = true;
export const usage = ''
export function execute(message, args) {
    const game = message.client.game;
    if (!game) {
        return message.channel.send('No one has started a game yet. Use the \`newgame\` command to start one!');
    } else if (game.status === 'playing') { 
        return message.channel.send('The game is already in progress.');
    } else if (!(game.team1 && game.team2)) {
        return message.channel.send('Teams haven\'t been formed yet, please use \`teams\` to create them!');
    } else if (game.players.length < 4) {
        return message.channel.send('We need 4 or more players to start a game. Let\'s find some more!'); 
    } else {
        game.start();
        sendNewRoundMessages(message.client, message.channel);
    }
