import { ClientEvents, Collection, Events } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import { exit } from 'process';
import { LambdabotEvent } from '../helpers/lambda.interface';

export class EventLoader {
  eventsDirectory = path.resolve(__dirname, '../events');

  async getEvents(): Promise<Collection<keyof ClientEvents, LambdabotEvent>> {
    const events = new Collection<keyof ClientEvents, LambdabotEvent>();
    const eventFiles = fs.readdirSync(this.eventsDirectory)
      .filter(file => file.endsWith('event.ts'));

    for (const file of eventFiles) {
      try {
        const newEvent: LambdabotEvent = await import(`${this.eventsDirectory}/${file}`);
        events.set(newEvent.name, newEvent);
        console.log(`Got event: ${newEvent.name}`);
      } catch (error) {
        console.log(error);
        exit(1);
      }
    }
    return events;
  }
}