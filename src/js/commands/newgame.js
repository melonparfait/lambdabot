import * as djs from 'discord.js';
import { Game } from '../models/game';

export const name = 'newgame';
export const aliases = ['new'];
export const cooldown = 5;
export const description = 'Starts a new game of Wavelength';
export const guildOnly = true;
export const usage = ''
export function execute(message, args) {
    if (message.client.game && message.client.game.status !== 'finished') {
        return message.reply('It looks like there\'s already a game running.');
    } else {
        message.client.game = new Game();
    }
}