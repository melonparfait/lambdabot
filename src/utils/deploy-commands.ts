import { bot_token, client_id, dev_guild_id } from '../../keys.json';
import * as fs from 'fs';
import { REST } from '@discordjs/rest';
import { NewCommand } from '../helpers/lambda.interface';
import { exit } from 'process';
import { Routes } from 'discord-api-types/rest/v9';
import { LambdaClient } from '../lambda-client';
import path = require('path');
import { SlashCommandBuilder } from '@discordjs/builders';

export async function loadCommands(client: LambdaClient) {
  const rest = new REST({ version: '9' }).setToken(bot_token);
  const apiCommands: any[] = [];
  const commandDirectory = path.resolve(__dirname, '../commands');

  const commandFiles = fs.readdirSync(commandDirectory).filter(file => file.endsWith('new.command.ts'));
  for (const file of commandFiles) {
    console.log('file: ', `${commandDirectory}/${file}`);
    try {
      const newCommand = await import(`${commandDirectory}/${file}`);
      const foo = newCommand.PingCommand;
      console.log('newCommand: ', JSON.stringify(newCommand));
      console.log('foo: ', JSON.stringify(foo));
      client.commands.set(newCommand.data.name, newCommand);
      console.log('newCommand.data: ', newCommand.data);
      apiCommands.push(newCommand.data.toJSON());
      console.log(`Added command: ${newCommand.name}`);
    } catch (error) {
      console.log(error);
      exit(1);
    }
  }

  if (client) {
    return rest.put(
      Routes.applicationCommands(client_id),
      { body: apiCommands });
  } else {
    return rest.put(
      Routes.applicationGuildCommands(client_id, dev_guild_id),
      { body: apiCommands });
  }
}
