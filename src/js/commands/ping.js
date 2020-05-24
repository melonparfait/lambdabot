export const name = 'ping';
export const aliases = [];
export const cooldown = 5;
export const description = 'Ping!';
export const guildOnly = true;
export const args = false;
export function execute(message, args) {
    message.channel.send('Pong?');
}