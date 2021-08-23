import { bot_token, owner_id } from '../keys.json';
import { DBService } from './db.service';
import { LambdaClient } from './lambda-client';

export class AuthSession {
  get dbConnection() {
    return this.dbService.db;
  }

  constructor(private dbService: DBService, public lambda: LambdaClient) {
  }

  async authorize() {
    return this.lambda.login(bot_token);
  }

  close() {
    this.lambda.destroy();
    console.log('Exited Discord client');
    this.dbService.disconnect();
  }
}