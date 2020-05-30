export const name = 'maketeams';
export const aliases = ['teams'];
export const cooldown = 5;
export const description = 'Creates teams for the current game';
export const guildOnly = true;
export const usage = ''
export function execute(message, args) {
    if (!message.client.game || message.client.game.status === 'finished') {
        return message.reply('No one has started a game yet. Use the \`newgame\` command to start one!');
    } else if (message.client.game.status === 'playing') {
        message.channel.send('Sorry, teams cannot be created when a game is already in progress.')
    } else {
        message.client.game.createTeams();
        const team1 = message.client.game.team1.players
            .map(id => `<@${id}>`).join(', ');
        const team2 = message.client.game.team2.players
            .map(id => `<@${id}>`).join(', ');
        return message.channel.send('Team1: ' + team1 + '\nTeam2: ' + team2);
    }
}