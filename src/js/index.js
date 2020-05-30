import { bot_token } from '../../keys.json';
import { bot_prefix, default_cooldown } from '../../config.json';
import { AuthSession } from './auth';
import * as djs from 'discord.js';
import * as fs from 'fs';
const neatCSV = require('csv-parser');

const session = new AuthSession(bot_token);
session.client.commands = new djs.Collection();
const cooldowns = new djs.Collection();

const commandFiles = fs.readdirSync(__dirname + '/commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	session.client.commands.set(command.name, command);
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

session.client.on('message', message => {
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

  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new djs.Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || default_cooldown) * 1000;

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

  try {
    command.execute(message, args);
  } catch (error) {
    console.error(error);
    message.reply('there was an error trying to execute that command!');
  }

});

session.authorize();