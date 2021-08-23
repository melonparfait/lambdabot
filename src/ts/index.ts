import { bot_prefix, default_cooldown } from '../../config.json';
import { AuthSession } from './auth';
import { Collection, Interaction, Message } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import * as fs from 'fs';
import { NewCommand, DiscordMessage } from './helpers/lambda.interface';
import { exit } from 'process';
import { DBService } from './db.service';
import { LambdaClient } from './discord.service';
import { SlashCommandBuilder } from '@discordjs/builders';
import { bot_token, client_id } from '../../keys.json';

const dbService = new DBService();
const lambdaClient = new LambdaClient(dbService);
const session = new AuthSession(dbService, lambdaClient);

const cooldowns = new Collection<string, Collection<string, Collection<string, number>>>();

async function loadCommands() {
  const rest = new REST({ version: '9' }).setToken(bot_token);

  const commandFiles = fs.readdirSync(__dirname + '/commands').filter(file => file.endsWith('new.command.ts'));
  for (const file of commandFiles) {
    try {
      const newCommand: NewCommand = await import(`./commands/${file}`);
      lambdaClient.commands.set(newCommand.data.name, newCommand);
      console.log(`Added command: ${bot_prefix}${newCommand.name}`);
    } catch (error) {
      console.log(error);
      exit(1);
    }
  }

  try {
    await rest.put(
      Routes.applicationCommands(client_id),
      { body: commands }
    )
  }
}


lambdaClient.on('ready', () => {
  console.log(`Logged in as ${lambdaClient.user.tag}!`);
});

lambdaClient.on('interactionCreate', async (interaction: Interaction) => {
  console.log('got interaction: ', interaction);

  if (!interaction.isCommand()) return;

  const command = lambdaClient.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.log(error);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
});

lambdaClient.on('message', (message: DiscordMessage) => {
  console.log('got message: ', message);
  if (!message.content.startsWith(bot_prefix) || message.author.bot) return;

  const args = message.content.slice(bot_prefix.length).split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = lambdaClient.commands.get(commandName)
    || lambdaClient.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
  if (!command) return;

  if (command.guildOnly && message.channel.type !== 'GUILD_TEXT') {
    message.reply('I can\'t execute that command outside of a server text channel!');
    return;
  }

  if (command.args && !args.length) {
    let reply = `You didn't provide any arguments, ${message.author}!`;

    if (command.usage) {
      reply += `\nThe proper usage would be: \`${bot_prefix}${command.name} ${command.usage}\``;
    }

    message.channel.send(reply);
    return;
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
          message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
          return;
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
          message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
          return;
        } else {
          userCooldowns.set(command.name, now);
          setTimeout(() => userCooldowns.delete(command.name), cooldownAmount);
        }
      }
    }
  }

  try {
    // command.execute(message, args);
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
      lambdaClient.loadClues();
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
