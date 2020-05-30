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