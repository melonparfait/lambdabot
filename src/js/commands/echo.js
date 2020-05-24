export const name = 'echo';
export const aliases = [];
export const cooldown = 5;
export const description = 'Echo!';
export const guildOnly = false;
export const usage = '<text>'
export const args = true;
export function execute(message, args) {
    message.channel.send(args);
}