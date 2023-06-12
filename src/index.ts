import { AuthSession } from './services/auth';
import { exit } from 'process';
import { DBService } from './services/db.service';
import { LambdaClient } from './lambda-client';
import { CommandLoader } from './services/command-loader';
import { CooldownManager } from './services/cooldown-manager';
import { GameManager } from './services/game-manager';
import { ClueManager } from './services/clue-manager';
import { EventLoader } from './services/event-loader';
import { ComponentHandlerLoader } from './services/component-handler-loader';

let mode: 'dev' | 'prod';
if (!(process?.argv[2] === 'dev' || process?.argv[2] === 'prod')) {
  console.log('Incorrect usage: please specify dev or prod environment');
  exit(1);
} else {
  mode = process.argv[2];
}

const dbService = new DBService();
const commandLoader = new CommandLoader();
const eventsLoader = new EventLoader();
const componentHandlerLoader = new ComponentHandlerLoader();
const cooldownManager = new CooldownManager();
const gameManager = new GameManager();
const clueManager = new ClueManager();
const lambdaClient = new LambdaClient(
  dbService,
  commandLoader,
  eventsLoader,
  componentHandlerLoader,
  cooldownManager,
  gameManager,
  clueManager);
const session = new AuthSession(lambdaClient);

session.authorize()
  .then(async () => {
    console.log('Connected to Discord!');
    try {
      await lambdaClient.initializeCommands(mode);
      console.log(`Successfully deployed commands to ${mode} server!`);
    } catch (err) {
      console.log(`Unable to load commands: ${err}`);
      session.close();
      exit(1);
    }

    try {
      await lambdaClient.initializeEvents();
    } catch (err) {
      console.log(`Unable to load events: ${err}`);
      session.close();
      exit(1);
    }

    try {
      await lambdaClient.initializeInteractionHandlers();
    } catch (err) {
      console.log(`Unable to load component handlers: ${err}`);
      session.close();
      exit(1);
    }

    try {
      dbService.connect();
    } catch (err) {
      console.log(`Unable to connect to database: ${err}`);
      session.close();
      exit(1);
    }

    try {
      clueManager.loadClues();
    } catch (err) {
      console.log(`Unable to load clues: ${err}`);
      dbService.disconnect();
      session.close();
      exit(1);
    }
  })
  .catch(err => {
    console.log(`Unable to login to discord: ${err}`);
});

