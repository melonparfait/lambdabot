export const name = 'version';
export const aliases = ['v'];
export const cooldown = 5;
export const description = '';
export const guildOnly = false;
export const usage = ''
export function execute(message, args) {
    message.channel.send('λ-bot JavaScript');
}