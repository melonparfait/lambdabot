import * as fs from 'fs';
import * as path from 'path';
import { Collection } from 'discord.js';
import { LambdabotComponentHandler } from '../helpers/lambda.interface';
import { exit } from 'process';

export class ComponentHandlerLoader {
  handlersDirectory = path.resolve(__dirname, '../component-interactions');

  async getComponentInteractions(): Promise<Collection<string, LambdabotComponentHandler>> {
    const componentInteractions = new Collection<string, LambdabotComponentHandler>();
    const componentInteractionFiles = fs.readdirSync(this.handlersDirectory)
      .filter(file => file.endsWith('component.ts'));

    for (const file of componentInteractionFiles) {
      try {
        const rawCompInteraction: { default: LambdabotComponentHandler } = await import(`${this.handlersDirectory}/${file}`);
        const newCompInteraction = rawCompInteraction.default;
        componentInteractions.set(newCompInteraction.componentId, newCompInteraction);
        console.log(`Got component handler: ${newCompInteraction.componentId}`);
      } catch (error) {
        console.log(error);
        exit(1);
      }
    }
    return componentInteractions;
  }
}