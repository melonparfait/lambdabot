import { ClientEvents, Events, Client, Interaction, ChatInputCommandInteraction, ChannelType } from 'discord.js';
import { EventTriggerType, LambdabotEvent } from '../helpers/lambda.interface';
import { owner_id } from '../../keys.json';
import { LambdaClient } from '../lambda-client';

export class InteractionCreateEvent extends LambdabotEvent {
  name = <keyof ClientEvents>Events.InteractionCreate;
  eventTriggerType = EventTriggerType.on;
  lambdaClient: LambdaClient;

  async execute(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;

    interaction = <ChatInputCommandInteraction>interaction;
  
    const command = this.lambdaClient.commands.get(interaction.commandName);
  
    if (!command || (command.isRestricted && interaction.user.id !== owner_id)) return;
  
    if (command.isGuildOnly && interaction?.channel?.type !== ChannelType.GuildText) {
      await interaction.reply({
        content: 'I can\'t execute that command outside of a server text channel!',
        ephemeral: true
      });
    }
  
    const cooldownCheckResult = this.lambdaClient.cooldownManager.checkCooldown(interaction, command);
    if (cooldownCheckResult.onCooldown) {
      await interaction.reply({
        content: `Please wait ${cooldownCheckResult.timeLeft} more second(s)
                  before reusing the \`${command.data.name}\` command.`,
        ephemeral: true
      });
    }
  
    try {
      await command.execute(interaction);
    } catch (error) {
      console.log(error);
      await interaction.reply({
        content: 'There was an error while executing this command!',
        ephemeral: true
      });
    }
  }
}

module.exports = new InteractionCreateEvent();