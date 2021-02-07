import { Client, Collection } from 'discord.js';
import { DBService } from './db.service';
import { Command } from './helpers/lambda.interface';
import { Game } from './models/game';
import { Outcome } from './models/round';
import { OffenseScore } from './models/scoring.results';

export class LambdaClient extends Client {
  commands = new Collection<string, Command>();
  games = new Collection<string, Game>();
  data: any;

  constructor(public dbService: DBService) {
    super();
  }

  finalizeGame(channelId: string) {
    // TODO: push game data to DB
    const game = this.games.get(channelId);
    const gameData = {
      team1: game.team1.players,
      team2: game.team2.players,
      game: {
        id: game.id,
        channel: channelId,
        team1Score: game.team1.points,
        team2Score: game.team2.points
      },
      scores: game.outcomes
    };

    this.games.delete(channelId);
  }
}