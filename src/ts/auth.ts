import { Client, Collection } from 'discord.js';
import { CommandoClient } from 'discord.js-commando';
import { Command } from './helpers/lambda.interface';
import { Game } from './models/game';
import { bot_prefix, default_cooldown } from '../../config.json';
import { bot_token, owner_id } from '../../keys.json';

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
    commandoClient: CommandoClient;

    constructor(public bot_token: string) {
      this.client = new DiscordService();
      this.commandoClient = new CommandoClient({
        commandPrefix: bot_prefix,
        owner: owner_id
      });
    }

    authorize() {
      this.client.login(this.bot_token);
      console.log('Connected!');
    }
}