export function sendNewRoundMessages(client, channel) {
    const game = client.game;
    const clueIndex = Math.floor(Math.random() * client.data.length);
    game.round.leftClue = client.data[clueIndex].Lower;
    game.round.rightClue = client.data[clueIndex].Higher;

    const user = client.users.cache.get(game.round.clueGiver);
    user.send(`\n**Round ${game.clueCounter + 1}:**`
        + '\nYou\'re the clue giver!'
        + '\nThe clue is:'
        + `\n├─ Lower: ${game.round.leftClue}`
        + `\n└─ Higher: ${game.round.rightClue}`
        + `\nThe target number is: ${game.round.value}`).then(() => {
            channel.send(`**Round ${game.clueCounter + 1}:**`
                + `\nTeam ${game.guessingTeam()} guesses. `
                + `(<@${game.round.clueGiver}> is the clue giver.)`
                + '\nThe clue is:'
                + `\n├─ Lower: ${game.round.leftClue}`
                + `\n└─ Higher: ${game.round.rightClue}`);
            }).catch(error => {
                console.error(`Could not send the clue to ${user.tag}.\n`, error);
                channel.send(`<@${game.round.clueGiver}> was the clue giver, `
                    + 'but I couldn\'t DM them. Do they have DMs disabled?');
        });
}