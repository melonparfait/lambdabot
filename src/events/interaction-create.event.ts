import { ClientEvents, Events, Client, Interaction, ChatInputCommandInteraction, ChannelType, InteractionReplyOptions } from 'discord.js';
import { EventTriggerType, LambdabotEvent } from '../helpers/lambda.interface';
import { owner_id } from '../../keys.json';
import { LambdaClient } from '../lambda-client';
import { errorProcessingCommand, noPermissions } from '../helpers/print.gameinfo';

export class InteractionCreateEvent extends LambdabotEvent {
  name = <keyof ClientEvents>Events.InteractionCreate;
  eventTriggerType = EventTriggerType.on;
  lambdaClient: LambdaClient;

  isTokenStillValid(interaction: Interaction) {
    const elapsedTime = Date.now() - interaction.createdTimestamp;
    return elapsedTime < 3 * 1000;
  }

  async execute(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;
    interaction = <ChatInputCommandInteraction>interaction;

    try {
      const command = this.lambdaClient.commands.get(interaction.commandName);
    
      if (!command || (command.isRestricted && interaction.user.id !== owner_id)) {
        return await interaction.reply(noPermissions);
      }
    
      if (command.isGuildOnly && interaction?.channel?.type !== ChannelType.GuildText) {
        return await interaction.reply({
          content: 'I can\'t execute that command outside of a server text channel!',
          ephemeral: true
        });
      }
    
      const cooldownCheckResult = this.lambdaClient.cooldownManager.checkCooldown(interaction, command);
      if (cooldownCheckResult.onCooldown) {
        return await interaction.reply({
          content: `Please wait ${cooldownCheckResult.timeLeft} more second(s)
                    before reusing the \`${command.data.name}\` command.`,
          ephemeral: true
        });
      }

      return await command.execute(interaction);

    } catch (error) {
      console.log(error);
      try {
        if (this.isTokenStillValid(interaction)) {
          if (!interaction.replied) {
            return await interaction.reply(errorProcessingCommand);
          } else {
            return await interaction.followUp(errorProcessingCommand);
          }
        } else {
          return await interaction.channel?.send(<string>errorProcessingCommand.content);
        }
      } catch (error2) {
        console.log(error2);
      }
    }
  }
}

module.exports = new InteractionCreateEvent();