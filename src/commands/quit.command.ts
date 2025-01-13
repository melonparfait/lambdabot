import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { LambdabotCommand } from '../helpers/lambda.interface';
import { couldNotUnPin, noActiveGameMessage, sendMessageToChannel } from '../helpers/print.gameinfo';

export class QuitCommand extends LambdabotCommand {
  isRestricted = false;
  cooldown = 5;
  hasChannelCooldown = true;
  isGuildOnly = true;
  data = new SlashCommandBuilder()
    .setName('quit')
    .setDescription('Stops the current game');
  async execute(interaction: CommandInteraction) {

    if (!this.gameManager.hasGame(interaction.channelId)) {
      return interaction.reply(noActiveGameMessage);
    } else {
      const game = this.gameManager.getGame(interaction.channelId);
      game.endGame();
      this.gameManager.removeGame(interaction.channelId);
      try {
        await game.pinnedInfo?.unpin();
      } catch (err) {
        const channel = interaction.channel;
        if (channel === null) {
          console.log('could not find a channel for this interaction');
        } else {
          sendMessageToChannel(channel, couldNotUnPin);
          console.log(err);
        }
      }
      return interaction.reply(this.stoppedGameMsg);
    }
  }

  stoppedGameMsg = 'I stopped the current game.';
}

export default new QuitCommand();
