export const name = 'gameinfo';
export const aliases = ['info'];
export const cooldown = 5;
export const description = 'Posts information about the current game into chat';
export const guildOnly = true;
export const usage = ''
export function execute(message, args) {
    if (!message.client.game) {
        return message.reply('No one has started a game yet. Use the \`newgame\` command to start one!');
    } else if (message.client.game.status === 'team_formation') {
        return message.reply('It looks like the game hasn\'t started yet, we\'re still forming teams!');
    } else {
        const status = message.client.game.status === 'playing' ? 'In Progress' : 'Finished'; 
        return message.channel.send(`**Game Status**: ${status}`
            + `\nRound: ${message.client.game.clueCounter + 1}`
            + `\nTeam ${message.client.game.guessingTeam()} guesses. `
            + `<@${message.client.game.round.clueGiver}> is the clue giver.`
            + '\nTeam 1'
            + `\n├─ Players: ${message.client.game.team1.players.map(id => `<@${id}>`).join(', ')}`
            + `\n└─ Points: ${message.client.game.team1.points}`
            + '\nTeam 2'
            + `\n├─ Players: ${message.client.game.team2.players.map(id => `<@${id}>`).join(', ')}`
            + `\n└─ Points: ${message.client.game.team2.points}`);
    }
}