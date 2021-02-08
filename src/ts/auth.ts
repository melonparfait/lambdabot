import { bot_token, owner_id } from '../../keys.json';
import { DBService } from './db.service';
import { LambdaClient } from './discord.service';

export class AuthSession {
  get dbConnection() {
    return this.dbService.db;
  }

  constructor(private dbService: DBService, public lambda: LambdaClient) {
  }

  async authorize() {
    try {
      await this.lambda.login(bot_token);
      console.log('Connected to Discord!');
    } catch (err) {
      console.log(`Unable to connect: ${err}`);
    }
  }

  close() {
    this.lambda.destroy();
    console.log('Exited Discord client');
    this.dbService.disconnect();
  }
}