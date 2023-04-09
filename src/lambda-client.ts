import { Client, ClientEvents, Collection, Events, GatewayIntentBits } from 'discord.js';
import { DBService } from './services/db.service';
import { EventTriggerType, LambdabotCommand, LambdabotComponentHandler, LambdabotEvent } from './helpers/lambda.interface';
import neatCSV = require('csv-parser');
import { CommandLoader } from './services/command-loader';
import { EventLoader } from './services/event-loader';
import { ComponentHandlerLoader } from './services/component-handler-loader';
import { CooldownManager } from './services/cooldown-manager';
import { GameManager } from './services/game-manager';
import { ClueManager } from './services/clue-manager';

export class LambdaClient extends Client {
  /** A collection of the client's command set keyed by command name */
  commands: Collection<string, LambdabotCommand>;
  events: Collection<keyof ClientEvents, LambdabotEvent>;
  componentHandlers: Collection<string, LambdabotComponentHandler>;

  constructor(public dbService: DBService,
      public commandLoader: CommandLoader,
      public eventLoader: EventLoader,
      public componentInteractionLoader: ComponentHandlerLoader,
      public cooldownManager: CooldownManager,
      public gameManager: GameManager,
      public clueManager: ClueManager) {
    super({ intents: [GatewayIntentBits.Guilds] });
  }

  async initializeCommands(mode: 'dev' | 'prod') {
    const existingCommandsFromAPI = await this.commandLoader.getCommandListFromAPI(mode);
    this.commands = await this.commandLoader.getCommands();
    this.commands.forEach(value => {
      value.setLambdaClient(this);
    });
    if (mode === 'dev') {
      await this.commandLoader.registerCommandsToDevAPI(existingCommandsFromAPI);
    } else if (mode === 'prod') {
      await this.commandLoader.deleteSlashCommands('dev');
      await this.commandLoader.registerCommandsToProdAPI(existingCommandsFromAPI);
    }

    // TODO: set command permissions
  }

  async initializeInteractionHandlers() {
    this.componentHandlers = await this.componentInteractionLoader.getComponentInteractions();
    this.componentHandlers.forEach(value => {
      value.configureInteractions(this);
    });
  }

  async initializeEvents() {
    this.events = await this.eventLoader.getEvents();
    this.events.forEach((value, key: keyof ClientEvents) => {
      value.setLambdaClient(this);
      if (value.eventTriggerType === EventTriggerType.on) {
        this.on(key, (...args) => value.execute(...args));
      } else {
        this.once(key, (...args) => value.execute(...args));
      }
    });
  }
}