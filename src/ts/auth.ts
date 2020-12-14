import { bot_token, owner_id } from '../../keys.json';
import { DBService } from './db.service';
import { DiscordClient } from './discord.service';

export class AuthSession {
  get dbConnection() {
    return this.dbService.db;
  }

  constructor(private dbService: DBService, public discordService: DiscordClient) {
  }

  async authorize() {
    try {
      await this.discordService.login(bot_token);
      console.log('Connected to Discord!');
    } catch (err) {
      console.log(`Unable to connect: ${err}`);
    }
  }

  close() {
    this.discordService.destroy();
    console.log('Exited Discord client');
    this.dbService.disconnect();
  }
}