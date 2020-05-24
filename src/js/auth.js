import { Client } from 'discord.js';

export class AuthSession {
    constructor(bot_token) {
        this.bot_token = bot_token;
        this.client = new Client();
    }

    authorize() {
        this.client.login(this.bot_token);
        console.log('Connected!');
    }
}