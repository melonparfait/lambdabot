import { REST } from '@discordjs/rest';
import { APIApplicationCommand, Routes } from 'discord-api-types/v9';
import path = require('path');
import { exit } from 'process';
import { bot_token, client_id, dev_guild_id } from '../keys.json';
import * as fs from 'fs';
import { Command } from './helpers/lambda.interface';
import { ApplicationCommand, ApplicationCommandData, Collection } from 'discord.js';
import { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from '@discordjs/builders';

export class CommandLoader {
  rest = new REST({ version: '9' }).setToken(bot_token);
  apiCommandData: (SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup"> | SlashCommandSubcommandsOnlyBuilder)[] = [];
  commandDirectory = path.resolve(__dirname, './commands');

  constructor() {}

  async getCommands(): Promise<Collection<string, Command>> {
    const commands = new Collection<string, Command>();
    const commandFiles = fs.readdirSync(this.commandDirectory)
      .filter(file => file.endsWith('new.command.ts'));

    for (const file of commandFiles) {
      try {
        const newCommand: Command = await import(`${this.commandDirectory}/${file}`);
        commands.set(newCommand.data.name, newCommand);
        console.log(`Got command: ${newCommand.data.name}`);
        this.apiCommandData.push(newCommand.data);
      } catch (error) {
        console.log(error);
        exit(1);
      }
    }
    return commands;
  }

  async getCommandListFromAPI(mode: 'dev' | 'prod'): Promise<APIApplicationCommand[]> {
    if (mode === 'dev') {
      return this.rest.get(Routes.applicationGuildCommands(client_id, dev_guild_id)) as Promise<APIApplicationCommand[]>;
    } else {
      return this.rest.get(Routes.applicationCommands(client_id)) as Promise<APIApplicationCommand[]>;
    }
  }

  async deleteSlashCommands(mode: 'dev' | 'prod'): Promise<any> {
    if (mode === 'dev') {
      return this.rest.put(
        Routes.applicationGuildCommands(client_id, dev_guild_id),
        { body: [] });
    } else {
      return this.rest.put(
        Routes.applicationCommands(client_id),
        { body: [] });
    }
  }

  async registerCommandsToDevAPI(existingCommands: APIApplicationCommand[]) {
    const devApiPayload = this.apiCommandData
      .map(command => command.setDescription(command.description + ' (dev)'))
      .map(command => command.toJSON());
    if (this.apiCommandData.length === 0) {
      console.log('No commands to register. Deleting all slash commands from dev guild.');
      return this.rest.put(
        Routes.applicationGuildCommands(client_id, dev_guild_id),
        { body: [] });
    } else {
      this.apiCommandData
      return this.rest.put(
        Routes.applicationGuildCommands(client_id, dev_guild_id),
        { body: devApiPayload });
    }
  }

  async registerCommandsToProdAPI(existingCommands: APIApplicationCommand[]) {
    const apiPayload = this.apiCommandData.map(command => command.toJSON());
    if (this.apiCommandData.length === 0) {
      console.log('No commands to register. Deleting all slash commands globally.');
      return this.rest.put(
        Routes.applicationCommands(client_id),
        { body: [] });
    } else {
      return this.rest.put(
        Routes.applicationCommands(client_id),
        { body: apiPayload });
    }
  }
}