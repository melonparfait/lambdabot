import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import path = require('path');
import { exit } from 'process';
import { bot_token, client_id, dev_guild_id } from '../keys.json';
import * as fs from 'fs';
import { NewCommand } from './helpers/lambda.interface';
import { Collection } from 'discord.js';

export class CommandLoader {
  rest = new REST({ version: '9' }).setToken(bot_token);
  apiCommands: any[] = [];
  commandDirectory = path.resolve(__dirname, './commands');

  constructor() {}

  async getCommands(): Promise<Collection<string, NewCommand>> {
    const commands = new Collection<string, NewCommand>();
    const commandFiles = fs.readdirSync(this.commandDirectory)
      .filter(file => file.endsWith('new.command.ts'));

    for (const file of commandFiles) {
      try {
        const newCommand = await import(`${this.commandDirectory}/${file}`);
        commands.set(newCommand.data.name, newCommand);
        console.log(`Got command: ${newCommand.data.name}`);
        this.apiCommands.push(newCommand.data.toJSON());
      } catch (error) {
        console.log(error);
        exit(1);
      }
    }

    return commands;
  }

  async registerCommandsToDevAPI() {
    if (this.apiCommands.length === 0) {
      console.log('No commands to register');
    } else {
      return this.rest.put(
        Routes.applicationGuildCommands(client_id, dev_guild_id),
        { body: this.apiCommands });
    }
  }

  async registerCommandsToProdAPI() {
    if (this.apiCommands.length === 0) {
      console.log('No commands to register');
    } else {
      return this.rest.put(
        Routes.applicationCommands(client_id),
        { body: this.apiCommands });
    }
  }
}