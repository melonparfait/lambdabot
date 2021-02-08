import { Client, Collection } from 'discord.js';
import { DBService } from './db.service';
import { Command } from './helpers/lambda.interface';
import { Game } from './models/game';
import { OffenseScore } from './models/scoring.results';

export class LambdaClient extends Client {
  commands = new Collection<string, Command>();
  games = new Collection<string, Game>();
  data: any;

  constructor(public dbService: DBService) {
    super();
  }

  finalizeGame(channelId: string, commit = true) {
    const game = this.games.get(channelId);
    if (commit) {
      this.dbService.updateDatabase(game.team1.players,
        game.team2.players,
        game.id,
        channelId,
        game.team1.points,
        game.team2.points,
        game.outcomes);
    }
    this.games.delete(channelId);
  }
}