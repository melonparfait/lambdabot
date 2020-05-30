export function sendGameEndScoreboard(channel, game) {
    channel.send(game.winner + ' has won the game!'
        + '\nFinal stats:'
        + `\nRounds played: ${game.clueCounter}`
        + '\nTeam 1'
        + `\n├─ Players: ${game.team1.players.map(id => `<@${id}>`).join(', ')}`
        + `\n└─ Points: ${game.team1.points}`
        + '\nTeam 2'
        + `\n├─ Players: ${game.team2.players.map(id => `<@${id}>`).join(', ')}`
        + `\n└─ Points: ${game.team2.points}`);
}