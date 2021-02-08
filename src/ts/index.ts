import { bot_prefix, default_cooldown } from '../../config.json';
import { AuthSession } from './auth';
import { Collection, Message } from 'discord.js';
import * as fs from 'fs';
import neatCSV = require('csv-parser');
import { Command, DiscordMessage } from './helpers/lambda.interface';
import { exit } from 'process';
import { Clue } from './models/clue';
import { DBService } from './db.service';
import { LambdaClient } from './discord.service';

const dbService = new DBService();
const lambdaClient = new LambdaClient(dbService);
const session = new AuthSession(dbService, lambdaClient);

const userCooldowns = new Collection<string, Collection<string, number>>();
const channelCooldowns = new Collection<string, number>();

async function loadCommands() {
  const commandFiles = fs.readdirSync(__dirname + '/commands').filter(file => file.endsWith('.command.ts'));
  for (const file of commandFiles) {
    try {
      const newCommand: Command = await import(`./commands/${file}`);
      lambdaClient.commands.set(newCommand.name, newCommand);
      console.log(`Added command: ${bot_prefix}${newCommand.name}`);
    } catch (error) {
      console.log(error);
      exit(1);
    }
  }
}

const results: Clue[] = [];
fs.createReadStream('./data.csv')
  .pipe(neatCSV(['Lower', 'Higher']))
  .on('data', (data) => results.push(data))
  .on('end', () => {
    lambdaClient.data = results;
  });

lambdaClient.on('ready', () => {
  console.log(`Logged in as ${lambdaClient.user.tag}!`);
});

lambdaClient.on('message', (message: DiscordMessage) => {
  if (!message.content.startsWith(bot_prefix) || message.author.bot) return;

  const args = message.content.slice(bot_prefix.length).split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = lambdaClient.commands.get(commandName)
    || lambdaClient.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
  if (!command) return;

  if (command.guildOnly && message.channel.type !== 'text') {
    return message.reply('I can\'t execute that command inside DMs!');
  }

  if (command.args && !args.length) {
    let reply = `You didn't provide any arguments, ${message.author}!`;

    if (command.usage) {
      reply += `\nThe proper usage would be: \`${bot_prefix}${command.name} ${command.usage}\``;
    }

    return message.channel.send(reply);
  }

  const cooldownAmount = (command.cooldown || default_cooldown) * 1000;

  if (cooldownAmount !== 0) {
    const now = Date.now();
    if (command.channelCooldown) {
      if (!channelCooldowns.has(command.name)) {
        channelCooldowns.set(command.name, now);
      } else {
        const timestamp = channelCooldowns.get(command.name);
        const expirationTime = timestamp + cooldownAmount;
        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000;
          return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
        } else {
          channelCooldowns.set(command.name, now);
          setTimeout(() => channelCooldowns.delete(command.name));
        }
      }
    } else {
      if (!userCooldowns.has(command.name)) {
        userCooldowns.set(command.name, new Collection<string, number>());
      }
      const timestamps = userCooldowns.get(command.name);
      if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000;
          return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
        }
      } else {
        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
      }
    }
  }

  try {
    if (command.name !== 'updatedb') {
      command.execute(message, args);
    } else {
      command.execute(message, [args.join(' ')]);
    }
  } catch (error) {
    console.error(error);
    message.reply('there was an error trying to execute that command!');
  }
});

loadCommands()
  .then(async () => {
    try {
      await session.authorize();
      dbService.connect();
    } catch {
      session.close();
      dbService.disconnect();
      exit(1);
    }
  })
  .catch(err => {
    console.log(`Unable to load commands: ${err}`);
    exit(1);
  });
