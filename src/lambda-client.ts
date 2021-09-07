import { Client, Collection, Intents } from 'discord.js';
import { DBService } from './db.service';
import { Command } from './helpers/lambda.interface';
import { Game } from './models/game';
import neatCSV = require('csv-parser');
import { Clue } from './models/clue';
import { CommandLoader } from './command-loader';
import { CooldownManager } from './cooldown-manager';
import { owner_id } from '../keys.json';
import { GameManager } from './game-manager';
import { ClueManager } from './clue-manager';

export class LambdaClient extends Client {
  /** A collection of the client's command set keyed by command name */
  commands: Collection<string, Command>;

  constructor(public dbService: DBService,
      public commandLoader: CommandLoader,
      public cooldownManager: CooldownManager,
      public gameManager: GameManager,
      public clueManager: ClueManager) {
    super({ intents: [Intents.FLAGS.GUILDS] });
  }

  async initializeCommands(mode: 'dev' | 'prod') {
    this.commands = await this.commandLoader.getCommands();
    if (mode === 'dev') {
      await this.commandLoader.registerCommandsToDevAPI();
    } else if (mode === 'prod') {
      await this.commandLoader.registerCommandsToProdAPI();
    }

    // TODO: set command permissions
  }

  finalizeGame(channelId: string, commit = true) {
    const game = this.gameManager.getGame(channelId);
    if (commit) {
      this.dbService.updateDatabase(game.team1.players,
        game.team2.players,
        game.id,
        channelId,
        game.team1.points,
        game.team2.points,
        game.outcomes);
    }
    this.gameManager.removeGame(channelId);
  }
}