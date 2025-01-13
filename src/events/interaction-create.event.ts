import { ClientEvents, Events, Interaction, ChatInputCommandInteraction, ChannelType, ButtonInteraction, TextBasedChannel, MessagePayload, MessageCreateOptions, MessageFlags } from 'discord.js';
import { EventTriggerType, LambdabotEvent } from '../helpers/lambda.interface';
import { owner_id } from '../../keys.json';
import { errorProcessingCommand, noPermissions } from '../helpers/print.gameinfo';

export class InteractionCreateEvent extends LambdabotEvent {
  name = <keyof ClientEvents>Events.InteractionCreate;
  eventTriggerType = EventTriggerType.on;

  static async interactionErrorResponse(interaction: ChatInputCommandInteraction | ButtonInteraction, error: any) {
    console.log(error);
    let channel = interaction.channel;
    try {
      if (channel === null) {
        throw new Error('interaction channel was null')
      } else if (channel?.partial) {
        channel = await channel.fetch();
      }

      if (!channel.isSendable()) {
        throw new Error('cannot send messages to this channel');
      } else {
        if (InteractionCreateEvent.isTokenStillValid(interaction)) {
          if (!interaction.replied) {
            return await interaction.reply(errorProcessingCommand);
          } else {
            return await interaction.followUp(errorProcessingCommand);
          }
        } else {
          return await channel.send(<string>errorProcessingCommand.content);
        }
      }
    } catch (error2) {
      console.log(error2);
    }
  }

  static isTokenStillValid(interaction: Interaction) {
    const elapsedTime = Date.now() - interaction.createdTimestamp;
    return elapsedTime < 3 * 1000;
  }

  async execute(interaction: Interaction) {
    if (interaction.isButton()) {
      interaction = <ButtonInteraction>interaction;
      try {
        const componentHandler = this.lambdaClient.componentHandlers.get(interaction.customId);
        return await componentHandler?.handleCommand(interaction);
      } catch (error) {
        return InteractionCreateEvent.interactionErrorResponse(interaction, error);
      }
    }

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
          flags: MessageFlags.Ephemeral
        });
      }
    
      const cooldownCheckResult = this.lambdaClient.cooldownManager.checkCooldown(interaction, command);
      if (cooldownCheckResult.onCooldown) {
        return await interaction.reply({
          content: `Please wait ${cooldownCheckResult.timeLeft} more second(s)
                    before reusing the \`${command.data.name}\` command.`,
          flags: MessageFlags.Ephemeral
        });
      }

      return await command.execute(interaction);

    } catch (error) {
      InteractionCreateEvent.interactionErrorResponse(interaction, error);
    }
  }
}

export default new InteractionCreateEvent();