import { bot_token, owner_id } from '../keys.json';
import { LambdaClient } from './lambda-client';

export class AuthSession {
  constructor(public lambda: LambdaClient) {
  }

  async authorize() {
    return this.lambda.login(bot_token);
  }

  close() {
    this.lambda.destroy();
    console.log('Exited Discord client');
  }
}