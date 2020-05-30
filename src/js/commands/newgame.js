import * as djs from 'discord.js';
import { Game } from '../models/game';

export const name = 'newgame';
export const aliases = ['new'];
export const cooldown = 5;
export const description = 'Starts a new game of Wavelength';
export const guildOnly = true;
export const usage = '[points to win]'
export function execute(message, args) {
    if (message.client.game && (message.client.game.status === 'team_formation'
        || message.client.game.status === 'playing')) {
        return message.reply('it looks like there\'s already a game running.');
    } else {
        const threshold = Math.floor(args) > 0 ? Math.floor(args) : 10;
        message.client.game = new Game(threshold);
        message.client.game.join(message.author.id);
        return message.reply(`started a new Wavelength game (first to ${threshold})! Use \`join\` to get in!`);
    }
}