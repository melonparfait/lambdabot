export const name = 'quit';
export const aliases = ['stop'];
export const cooldown = 5;
export const description = 'Stops the current game';
export const guildOnly = true;
export const usage = ''
export function execute(message, args) {
    if (!message.client.game) {
        return message.channel.send('No one has started a game yet. Use the \`newgame\` command to start one!');
    } else {
        message.client.game.end();
        return message.reply('stopped the current game.');
    }
}