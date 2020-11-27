import { Client, Collection } from 'discord.js';
import { Command } from './helpers/lambda.interface';
import { Game } from './models/game';

export class DiscordClient extends Client {
    commands: Collection<string, Command>;
    data: any;
    game: Game;
    constructor() {
      super();
    }
}

export class AuthSession {
    client: DiscordClient;

    constructor(public bot_token: string) {
      this.client = new DiscordClient();
    }

    authorize() {
      this.client.login(this.bot_token);
      console.log('Connected!');
    }
}