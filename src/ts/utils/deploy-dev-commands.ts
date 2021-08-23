import { bot_token, client_id, dev_guild_id } from '../../../keys.json';
import * as fs from 'fs';
import { REST } from '@discordjs/rest';
import { NewCommand } from '../helpers/lambda.interface';
import { exit } from 'process';
import { Routes } from 'discord-api-types/rest/v9';

export async function loadCommands() {
  const rest = new REST({ version: '9' }).setToken(bot_token);
  const commands: NewCommand[] = [];


  const commandFiles = fs.readdirSync(__dirname + '/commands').filter(file => file.endsWith('new.command.ts'));
  for (const file of commandFiles) {
    try {
      const newCommand: NewCommand = await import(`./commands/${file}`);
      commands.push(newCommand);
      // lambdaClient.commands.set(newCommand.data.name, newCommand);
      console.log(`Added command: ${newCommand.name}`);
    } catch (error) {
      console.log(error);
      exit(1);
    }
  }

  try {
    await rest.put(
      Routes.applicationGuildCommands(client_id, dev_guild_id),
      { body: commands }
    );
  } catch (error) {
    console.log(error);
  }
}

loadCommands()
  .then(() => console.log('Successfully loaded commands to dev environment!'))
  .catch(err => {
    console.log(`Unable to load commands: ${err}`);
    exit(1);
  });
