import { AuthSession } from './auth';
import { Collection, Interaction } from 'discord.js';
import { exit } from 'process';
import { DBService } from './db.service';
import { LambdaClient } from './lambda-client';
import { CommandLoader } from './command-loader';
import { CooldownManager } from './cooldown-manager';
import { owner_id } from '../keys.json';
import { GameManager } from './game-manager';
import { ClueManager } from './clue-manager';

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
const gameManager = new GameManager();
const clueManager = new ClueManager();
const lambdaClient = new LambdaClient(dbService, commandLoader, cooldownManager, gameManager, clueManager);
const session = new AuthSession(dbService, lambdaClient);

lambdaClient.on('ready', () => {
  console.log(`Logged in as ${lambdaClient.user.tag}!`);
});

lambdaClient.on('interactionCreate', async (interaction: Interaction) => {
  if (!interaction.isCommand()) return;

  const command = lambdaClient.commands.get(interaction.commandName);

  if (!command || (command.isRestricted && interaction.user.id !== owner_id)) return;

  if (command.isGuildOnly && interaction.channel.type !== 'GUILD_TEXT') {
    return interaction.reply({
      content: 'I can\'t execute that command outside of a server text channel!',
      ephemeral: true
    });
  }

  const cooldownCheckResult = lambdaClient.cooldownManager.checkCooldown(interaction, command);
  if (cooldownCheckResult.onCooldown) {
    return interaction.reply({
      content: `Please wait ${cooldownCheckResult.timeLeft} more second(s)
                before reusing the \`${command.data.name}\` command.`,
      ephemeral: true
    });
  }

  try {
    await command.execute(interaction, lambdaClient.gameManager, lambdaClient.clueManager, lambdaClient.users);
  } catch (error) {
    console.log(error);
    await interaction.reply({
      content: 'There was an error while executing this command!',
      ephemeral: true
    });
  }
});

session.authorize()
  .then(async () => {
    console.log('Connected to Discord!');
    try {
      await lambdaClient.initializeCommands(mode);
      console.log(`Successfully deployed commands to ${mode} server!`);
      try {
        dbService.connect();
        clueManager.loadClues();
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

