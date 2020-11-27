import { bot_token } from '../../keys.json';
import { bot_prefix, default_cooldown } from '../../config.json';
import { AuthSession } from './auth';
import { Collection, Message } from 'discord.js';
import * as fs from 'fs';
import neatCSV = require('csv-parser');
import { Command, DiscordMessage } from './helpers/lambda.interface';
import { exit } from 'process';

const session = new AuthSession(bot_token);
session.client.commands = new Collection<string, Command>();
const userCooldowns = new Collection<string, Collection<string, number>>();
const globalCooldowns = new Collection<string, number>();

async function loadCommands() {
  const commandFiles = fs.readdirSync(__dirname + '/commands').filter(file => file.endsWith('.command.ts'));
  for (const file of commandFiles) {
    try {
      const newCommand: Command = await import(`./commands/${file}`);
      session.client.commands.set(newCommand.name, newCommand);
      console.log(`Added command: ${bot_prefix}${newCommand.name}`);
    } catch (error) {
      console.log(error);
      exit(1);
    }
  }
}

const results = [];
fs.createReadStream('./data.csv')
  .pipe(neatCSV())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    session.client.data = results;
  });

session.client.on('ready', () => {
  console.log(`Logged in as ${session.client.user.tag}!`);
});

session.client.on('message', (message: DiscordMessage) => {
  if (!message.content.startsWith(bot_prefix) || message.author.bot) return;

  const args = message.content.slice(bot_prefix.length).split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = session.client.commands.get(commandName)
    || session.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
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
    if (command.globalCooldown) {
      if (!globalCooldowns.has(command.name)) {
        globalCooldowns.set(command.name, now);
      } else {
        const timestamp = globalCooldowns.get(command.name);
        const expirationTime = timestamp + cooldownAmount;
        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000;
          return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
        } else {
          globalCooldowns.set(command.name, now);
          setTimeout(() => globalCooldowns.delete(command.name));
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
    command.execute(message, args);
  } catch (error) {
    console.error(error);
    message.reply('there was an error trying to execute that command!');
  }
});

loadCommands().then(
  () => session.authorize(),
  err => {
    console.log(err);
    exit(1);
  },
);