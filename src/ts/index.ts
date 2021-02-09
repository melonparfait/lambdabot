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

const cooldowns = new Collection<string, Collection<string, Collection<string, number>>>();

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
    if (!cooldowns.has(message.channel.id)) {
      cooldowns.set(message.channel.id, new Collection<string, Collection<string, number>>());
    }
    const channelCooldowns = cooldowns.get(message.channel.id);

    if (command.channelCooldown) {
      if (!channelCooldowns.has('channel')) {
        channelCooldowns.set('channel', new Collection<string, number>());
        channelCooldowns.get('channel').set(command.name, now);
        setTimeout(() => channelCooldowns.get('channel').delete(command.name), cooldownAmount);
      } else {
        const cooldownForChannel = channelCooldowns.get('channel');
        const timestamp = cooldownForChannel.has(command.name) ? cooldownForChannel.get(command.name) : 0;
        const expirationTime = timestamp + cooldownAmount;
        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000;
          return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
        } else {
          cooldownForChannel.set(command.name, now);
          setTimeout(() => cooldownForChannel.delete(command.name), cooldownAmount);
        }
      }
    } else if (!channelCooldowns.has(message.author.id)) {
      channelCooldowns.set(message.author.id, new Collection<string, number>());
      channelCooldowns.get(message.author.id).set(command.name, now);
      setTimeout(() => channelCooldowns.get(message.author.id).delete(command.name), cooldownAmount);
    } else {
      const userCooldowns = channelCooldowns.get(message.author.id);
      if (!userCooldowns.has(command.name)) {
        userCooldowns.set(command.name, now);
        setTimeout(() => userCooldowns.delete(command.name), cooldownAmount);
      } else {
        const expirationTime = userCooldowns.get(command.name) + cooldownAmount;
        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000;
          return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
        } else {
          userCooldowns.set(command.name, now);
          setTimeout(() => userCooldowns.delete(command.name), cooldownAmount);
        }
      }
    }
  }

  try {
    command.execute(message, args);
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
