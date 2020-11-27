import { Client, Collection } from 'discord.js';
import { Command } from './helpers/lambda.interface';
import { Game } from './models/game';

export class DiscordService extends Client {
    commands: Collection<string, Command>;
    data: any;
    game: Game;
    constructor() {
      super();
    }
}

export class AuthSession {
    client: DiscordService;

    constructor(public bot_token: string) {
      this.client = new DiscordService();
    }

    authorize() {
      this.client.login(this.bot_token);
      console.log('Connected!');
    }
}