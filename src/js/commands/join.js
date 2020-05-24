import * as djs from 'discord.js';
import { Game } from '../models/game';

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
        return message.reply('The game is currently not open .');
    } else {
        message.client.game = new Game();
    }
}