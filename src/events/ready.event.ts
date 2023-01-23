import { ClientEvents, Events, Client } from 'discord.js';
import { EventTriggerType, LambdabotEvent } from '../helpers/lambda.interface';

export class ReadyEvent extends LambdabotEvent {
  name = <keyof ClientEvents>Events.ClientReady;
  eventTriggerType = EventTriggerType.on;
  async execute(client: Client) {
    console.log(`Logged in as ${client?.user?.tag ?? 'INVALID_USER'}!`);
  }
}

module.exports = new ReadyEvent();