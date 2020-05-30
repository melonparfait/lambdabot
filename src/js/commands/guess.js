export const name = 'guess';
export const aliases = [];
export const cooldown = 5;
export const description = 'Submits a guess for the guessing team';
export const guildOnly = true;
export const args = true;
export const usage = '<integer between 1 and 100>'
export function execute(message, args) {
    if (!message.client.game || message.client.game.status === 'finished') {
        return message.reply('no one has started a game yet. Use the \`newgame\` command to start one!');
    } else if (message.client.game.status !== 'playing') {
        return message.reply('it looks like the game isn\'t in progress yet.');
    } else if (message.author.id === message.client.game.round.clueGiver
            || !message.client.game.round.oTeam.players.includes(message.author.id)) {
        return message.reply('you\'re not eligible to make a vote right now.');
    } else {
        if (args < 1 || args > 100) {
            return message.reply('give me an integer between 1 and 100 please.');
        } else {
            message.client.game.round.makeOGuess(args);
            message.channel.send(`Team ${message.client.game.guessingTeam()} guessed ${args}.`
                + `\nTeam ${message.client.game.otherTeam()}, do you think the target is \`!higher\` or \`!lower\`?`)
            
            const dTeamReply = msg => {
                const isBot = msg.author.bot;
                const isGuess = msg.content.toLowerCase() === '!higher' || '!lower';
                const isPlayerOnDTeam = message.client.game.round.dTeam.players
                    .includes(msg.author.id);
                return !isBot && isGuess && isPlayerOnDTeam;
            }

            message.channel.awaitMessages(dTeamReply, { time: 180000, max: 1, errors: ['time'] })
                .then(messages => {
                    const isHigher = messages.last().content === '!higher';
                    message.client.game.round.makeDGuess(isHigher);
                    const dGuess = isHigher ? 'higher' : 'lower';
                    message.channel.send(`Team ${message.client.game.otherTeam()} thought the answer was ${dGuess}...`
                        + `\nThe real answer was ${message.client.game.round.value}!`);
                    message.client.game.endRound(message.channel);

                    if (message.client.game.status !== 'finished') {
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
                                message.channel.send(`**Round ${message.client.game.clueCounter + 1}:**`
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
                    } else {
                        message.channel.send(message.client.game.winner + ' has won the game!'
                            + '\nFinal stats:'
                            + `\nRounds played: ${message.client.game.clueCounter}`
                            + '\nTeam 1'
                            + `\n├─ Players: ${message.client.game.team1.players.map(id => `<@${id}>`).join(', ')}`
                            + `\n└─ Points: ${message.client.game.team1.points}`
                            + '\nTeam 2'
                            + `\n├─ Players: ${message.client.game.team2.players.map(id => `<@${id}>`).join(', ')}`
                            + `\n└─ Points: ${message.client.game.team2.points}`);
                    }
                })
                .catch((err) => {
                    console.log(err);
                    message.channel.send(`Team ${message.client.game.otherTeam()} ran out of time!`);
                    // TODO: assign a random guess?
                });
        }
    }
}