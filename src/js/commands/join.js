export const name = 'join';
export const aliases = [];
export const cooldown = 5;
export const description = 'Joins the current game';
export const guildOnly = true;
export const usage = ''
export function execute(message, args) {
    if (!message.client.game || message.client.game.status === 'finished') {
        return message.reply('No one has started a game yet. Use the \`newgame\` command to start one!');
    } else if (message.client.game.status !== 'team_formation') {
        return message.reply('Sorry, it looks like the game is already running.');
        // TODO: allow joining an in-progress game
    } else {
        if (message.client.game.join(message.author.id)) {
            return message.channel.send(`${message.author} joined the game!`);
        } else {
            return message.channel.send(`${message.author} is already in the game.`);
        }
    }
}