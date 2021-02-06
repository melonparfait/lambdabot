import { Client, Collection } from 'discord.js';
import { DBService } from './db.service';
import { Command } from './helpers/lambda.interface';
import { Game } from './models/game';

export class LambdaClient extends Client {
  commands = new Collection<string, Command>();
  games = new Collection<string, Game>();
  data: any;

  constructor(public dbService: DBService) {
    super();
  }

  finalizeGame(channelId: string) {
    // TODO: push game data to DB
    this.games.delete(channelId);
  }
}