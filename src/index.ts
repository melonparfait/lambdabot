import { AuthSession } from './auth';
import { Collection, Interaction } from 'discord.js';
import { exit } from 'process';
import { DBService } from './db.service';
import { LambdaClient } from './lambda-client';
import { CommandLoader } from './command-loader';
import { CooldownManager } from './cooldown-manager';

let mode: 'dev' | 'prod';
if (!(process?.argv[2] === 'dev' || process?.argv[2] === 'prod')) {
  console.log('Incorrect usage: please specify dev or prod environment');
  exit(1);
} else {
  mode = process.argv[2];
}

const dbService = new DBService();
const commandLoader = new CommandLoader();
const cooldownManager = new CooldownManager();
const lambdaClient = new LambdaClient(dbService, commandLoader, cooldownManager);
const session = new AuthSession(dbService, lambdaClient);

lambdaClient.on('ready', () => {
  console.log(`Logged in as ${lambdaClient.user.tag}!`);
});

lambdaClient.on('interactionCreate', async (interaction: Interaction) => {
  if (!interaction.isCommand()) return;

  const command = lambdaClient.commands.get(interaction.commandName);

  if (!command) return;

  if (command.guildOnly && interaction.channel.type !== 'GUILD_TEXT') {
    return interaction.reply({
      content: 'I can\'t execute that command outside of a server text channel!',
      ephemeral: true
    });
  }

  const cooldownCheckResult = lambdaClient.cooldownManager.checkCooldown(interaction, command);
  if (cooldownCheckResult.onCooldown) {
    return interaction.reply(`Please wait ${cooldownCheckResult.timeLeft} more second(s) before reusing the \`${command.name}\` command.`);
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.log(error);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
});

// lambdaClient.on('message', (message: DiscordMessage) => {
//   if (!message.content.startsWith(bot_prefix) || message.author.bot) return;

//   const args = message.content.slice(bot_prefix.length).split(/ +/);
//   const commandName = args.shift().toLowerCase();

//   const command = lambdaClient.commands.get(commandName)
//     || lambdaClient.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
//   if (!command) return;

//   if (command.guildOnly && message.channel.type !== 'GUILD_TEXT') {
//     message.reply('I can\'t execute that command outside of a server text channel!');
//     return;
//   }

//   if (command.args && !args.length) {
//     let reply = `You didn't provide any arguments, ${message.author}!`;

//     if (command.usage) {
//       reply += `\nThe proper usage would be: \`${bot_prefix}${command.name} ${command.usage}\``;
//     }

//     message.channel.send(reply);
//     return;
//   }

//   try {
//     command.execute(message, args);
//   } catch (error) {
//     console.error(error);
//     message.reply('there was an error trying to execute that command!');
//   }
// });

session.authorize()
  .then(async () => {
    console.log('Connected to Discord!');
    try {
      await lambdaClient.initializeCommands(mode);
      console.log(`Successfully deployed commands to ${mode} server!`);
      try {
        dbService.connect();
        lambdaClient.loadClues();
      } catch {
        session.close();
        dbService.disconnect();
        exit(1);
      }
    } catch (err) {
      console.log(`Unable to load commands: ${err}`);
      exit(1);
    }
  })
  .catch(err => {
    console.log(`Unable to login to discord: ${err}`);
  });

