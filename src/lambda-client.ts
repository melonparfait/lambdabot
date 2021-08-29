import { Client, Collection, Intents } from 'discord.js';
import { DBService } from './db.service';
import { Command } from './helpers/lambda.interface';
import { Game } from './models/game';
import * as fs from 'fs';
import neatCSV = require('csv-parser');
import { Clue } from './models/clue';
import { CommandLoader } from './command-loader';
import { CooldownManager } from './cooldown-manager';
import { owner_id } from '../keys.json';

export class LambdaClient extends Client {
  commands: Collection<string, Command>;
  games = new Collection<string, Game>();
  data: any;

  constructor(public dbService: DBService,
      public commandLoader: CommandLoader,
      public cooldownManager: CooldownManager) {
    super({ intents: [Intents.FLAGS.GUILDS] });
  }

  async initializeCommands(mode: 'dev' | 'prod') {
    this.commands = await this.commandLoader.getCommands();
    if (mode === 'dev') {
      await this.commandLoader.registerCommandsToDevAPI();
    } else if (mode === 'prod') {
      await this.commandLoader.registerCommandsToProdAPI();
    }

    // const commands = await this.application.commands.fetch('12345');
    // commands.each(async command => {
    //   await command.permissions.add({
    //     permissions: [
    //       {
    //         id: owner_id,
    //         type: 'USER',
    //         permission: true
    //       }
    //     ]
    //   });
    // });
  }

  loadClues() {
    const results: Clue[] = [];
    fs.createReadStream('./data.csv')
      .pipe(neatCSV(['Lower', 'Higher']))
      .on('data', (data) => results.push(data))
      .on('end', () => this.data = results);
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