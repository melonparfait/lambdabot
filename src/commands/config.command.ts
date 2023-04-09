import { LambdabotCommand } from '../helpers/lambda.interface';
import { errorProcessingCommand, noActiveGameMessage, setupOnly, updateGameInfo } from '../helpers/print.gameinfo';
import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, InteractionReplyOptions, TextBasedChannel } from 'discord.js';
import { GameManager } from '../services/game-manager';

export class ConfigCommand extends LambdabotCommand {
  isRestricted = false;
  cooldown = 5;
  hasChannelCooldown = true;
  isGuildOnly = true;
  data = new SlashCommandBuilder()
    .setName('config')
    .setDescription('Changes the configuration for the current game. Usable only during setup.')
    .addStringOption(option => option.setName('timers')
      .setDescription('Enables/disables timers for making guesses.')
      .setRequired(true)
      .addChoices(
        { name: 'Play with timers', value: 'on' },
        { name: 'Play without timers', value: 'off' },
      ))
    .addStringOption(option => option.setName('trackstats')
      .setDescription('Enables/disables stat tracking. Use `true` to track stats.')
      .setRequired(true)
      .addChoices(
        { name: 'Track stats', value: 'on' },
        { name: 'Don\'t track stats', value: 'off' }
      ))
    .addIntegerOption(option => option.setName('threshold')
      .setDescription('Number of points a team needs to win.')
      .setRequired(false))
    .addIntegerOption(option => option.setName('defensetimer')
      .setDescription('Number of seconds the defending team has to make a counter guess. (disabled if async)')
      .setRequired(false));
  async execute(interaction: ChatInputCommandInteraction) {
    let asyncConfig: boolean;
    let trackStatsConfig: boolean;
    let thresholdConfig: number | 'default';
    let defenseTimerConfig: number;

    const channelId = interaction.channelId;
    if (!this.gameManager.hasGame(channelId) || this.gameManager.checkForFinishedGame(channelId)) {
      return await interaction.reply(noActiveGameMessage);
    } else if (this.gameManager.getGame(channelId).status !== 'setup') {
      return await interaction.reply(setupOnly);
    } else {
      try {
        asyncConfig = interaction.options.getString('timers', true) === 'off';
        trackStatsConfig = interaction.options.getString('trackstats', true) === 'on';
        thresholdConfig = interaction.options.getInteger('threshold') ?? 'default';
        defenseTimerConfig = interaction.options.getInteger('defensetimer') ?? 90;

        if (thresholdConfig !== 'default') {
          if (thresholdConfig < 5) {
            return await interaction.reply(this.minimumThresholdError(thresholdConfig));
          } else if (defenseTimerConfig && defenseTimerConfig < 5) {
            return await  interaction.reply(this.minimumDefenseTimerError(defenseTimerConfig));
          } else if (thresholdConfig > 900000) {
            return await interaction.reply(this.maximumThresholdError(thresholdConfig));
          }
        }
        // conversion to seconds
        defenseTimerConfig = defenseTimerConfig * 1000;

      } catch (err) {
        return await interaction.reply(errorProcessingCommand);
      }
    }

    this.gameManager.getGame(channelId).setSettings({
      threshold: thresholdConfig,
      asyncPlay: asyncConfig,
      oGuessTime: 0,
      dGuessTime: defenseTimerConfig,
      trackStats: trackStatsConfig
    });

    await interaction.reply(this.sendUpdatedSettings(interaction.channelId, this.gameManager));
    await updateGameInfo(<TextBasedChannel>interaction.channel, this.gameManager);
  }

  sendUpdatedSettings(channelId: string, gameManager: GameManager) {
    return 'Changed game settings.';
  }

  minimumThresholdError(threshold: number | 'default'): InteractionReplyOptions {
    return {
      content: `Sorry, the minimum threshold is 5 points. (You tried to set it to ${threshold}.)`,
      ephemeral: true
    }
  }
  
  minimumDefenseTimerError(dTimer: number): InteractionReplyOptions {
    return {
      content: `Sorry, the minimum defense timer is 5 seconds. (You tried to set it to ${dTimer}.)`,
      ephemeral: true
    }
  }
  
  maximumThresholdError(threshold: number | 'default'): InteractionReplyOptions {
    return {
      content: `Sorry, that threshold (${threshold}) is too big. please give me a smaller number.`,
      ephemeral: true
    }
  }
}

module.exports = new ConfigCommand();