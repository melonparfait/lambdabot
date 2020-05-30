export const name = 'startgame';
export const aliases = ['start'];
export const cooldown = 5;
export const description = 'Starts the game using the current teams';
export const guildOnly = true;
export const usage = ''
export function execute(message, args) {
    if (!message.client.game) {
        return message.channel.send('No one has started a game yet. Use the \`newgame\` command to start one!');
    } else if (message.client.game.status === 'playing') { 
        return message.channel.send('The game is already in progress.');
    } else if (!(message.client.game.team1 && message.client.game.team2)) {
        return message.channel.send('Teams haven\'t been formed yet, please use \`teams\` to create them!');
    } else if (message.client.game.players.length < 4) {
        return message.channel.send('We need 4 or more players to start a game. Let\'s find some more!'); 
    } else {
        message.client.game.start();

        const clueIndex = Math.floor(Math.random() * message.client.data.length);
        message.client.game.round.leftClue = message.client.data[clueIndex].Lower;
        message.client.game.round.rightClue = message.client.data[clueIndex].Higher;

        const user = message.client.users.cache.get(message.client.game.round.clueGiver);
        user.send(`\n**Round ${message.client.game.clueCounter + 1}:**`
            + '\nYou\'re the clue giver!'
            + '\nThe clue is:'
            + `\n├─ Lower: ${message.client.game.round.leftClue}`
            + `\n└─ Higher: ${message.client.game.round.rightClue}`
            + `\nThe target number is: ${message.client.game.round.value}`).then(() => {
                const counter = message.client.game.clueCounter;
                message.channel.send('The game has begun!' 
                    + `\n**Round ${message.client.game.clueCounter + 1}:**`
                    + `\nTeam ${(counter % 2) + 1} guesses. `
                    + `(<@${message.client.game.round.clueGiver}> is the clue giver.)`
                    + '\nThe clue is:'
                    + `\n├─ Lower: ${message.client.game.round.leftClue}`
                    + `\n└─ Higher: ${message.client.game.round.rightClue}`);
                }).catch(error => {
                    console.error(`Could not send the clue to ${message.author.tag}.\n`, error);
                    message.channel.send(`<@${message.client.game.round.clueGiver}> was the clue giver, `
                        + 'but I couldn\'t DM them. Do they have DMs disabled?');
            });
    }
}