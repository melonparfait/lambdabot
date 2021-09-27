import { Command, DiscordMessage } from '../helpers/lambda.interface';
import { checkGamePhase } from '../helpers/command.errorchecks';
import { errorProcessingCommand, gameSettings, noActiveGameMessage, setupOnly, updateGameInfo } from '../helpers/print.gameinfo';
import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, InteractionReplyOptions } from 'discord.js';
import { GameManager } from '../game-manager';

export class ConfigCommand implements Command {
  isRestricted = false;
  cooldown = 5;
  hasChannelCooldown = true;
  isGuildOnly = true;
  data = new SlashCommandBuilder()
    .setName('config')
    .setDescription('Changes the configuration for the current game. Usable only during setup.')
    .addStringOption(option => option.setName('timers')
      .addChoice('Play with timers', 'on')
      .addChoice('Play without timers', 'off')
      .setDescription('Enables/disables timers for making guesses.')
      .setRequired(true))
    .addStringOption(option => option.setName('trackstats')
      .addChoice('Track stats', 'on')
      .addChoice('Don\'t track stats', 'off')
      .setDescription('Enables/disables stat tracking. Use `true` to track stats.')
      .setRequired(true))
    .addIntegerOption(option => option.setName('threshold')
      .setDescription('Number of points a team needs to win.')
      .setRequired(false))
    .addIntegerOption(option => option.setName('defensetimer')
      .setDescription('Number of seconds the defending team has to make a counter guess. (disabled if async)')
      .setRequired(false))
    .setDefaultPermission(true);
  async execute(interaction: CommandInteraction, gameManager: GameManager) {
    let asyncConfig: boolean;
    let trackStatsConfig: boolean;
    let thresholdConfig: number | 'default';
    let defenseTimerConfig: number;

    const channelId = interaction.channelId;
    if (!gameManager.hasGame(channelId) || gameManager.checkForFinishedGame(channelId)) {
      return interaction.reply(noActiveGameMessage);
    } else if (gameManager.getGame(channelId).status !== 'setup') {
      return interaction.reply(setupOnly);
    } else {
      try {
        asyncConfig = interaction.options.getString('timers', true) === 'off';
        trackStatsConfig = interaction.options.getString('trackstats', true) === 'on';
        thresholdConfig = interaction.options.getInteger('threshold') ?? 'default';
        defenseTimerConfig = interaction.options.getInteger('defensetimer');

        if (thresholdConfig < 5) {
          return interaction.reply(this.minimumThresholdError(thresholdConfig));
        } else if (defenseTimerConfig && defenseTimerConfig < 5) {
          return interaction.reply(this.minimumDefenseTimerError(defenseTimerConfig));
        } else if (thresholdConfig > 2147483647) {
          return interaction.reply(this.maximumThresholdError(thresholdConfig));
        }
        // conversion to seconds
        defenseTimerConfig = defenseTimerConfig * 1000;

      } catch (err) {
        interaction.reply(errorProcessingCommand);
      }
    }

    gameManager.getGame(channelId).setSettings({
      threshold: thresholdConfig,
      asyncPlay: asyncConfig,
      oGuessTime: 0,
      dGuessTime: defenseTimerConfig,
      trackStats: trackStatsConfig
    });

    await updateGameInfo(interaction.channel, gameManager);
    return interaction.reply(this.sendUpdatedSettings(interaction.channelId, gameManager));
  }

  sendUpdatedSettings(channelId: string, gameManager: GameManager) {
    return 'Changed the settings to:\n'
    + gameSettings(gameManager.getGame(channelId));
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