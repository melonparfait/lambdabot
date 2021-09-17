import { Command, DiscordMessage } from '../helpers/lambda.interface';
import { checkForGame, checkGamePhase } from '../helpers/command.errorchecks';
import { errorProcessingCommand, gameSettings, maximumThresholdError, minimumDefenseTimerError, minimumThresholdError, noActiveGameMessage, setupOnly, updateGameInfo } from '../helpers/print.gameinfo';
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
    .addBooleanOption(option => option.setName('async')
      .setDescription('Enables/disables timers for making guesses. Use `true` to play without timers.')
      .setRequired(true))
    .addBooleanOption(option => option.setName('trackstats')
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
        asyncConfig = interaction.options.getBoolean('async', true);
        trackStatsConfig = interaction.options.getBoolean('trackstats', true);
        thresholdConfig = interaction.options.getInteger('threshold') ?? 'default';
        defenseTimerConfig = interaction.options.getInteger('defensetimer');

        // console.log('asyncConfig: ', asyncConfig,
        //   '\ntrackStatsConfig: ', trackStatsConfig,
        //   '\nthresholdConfig: ', thresholdConfig,
        //   '\ndefenseTimer: ', defenseTimerConfig);

        if (thresholdConfig < 5) {
          return interaction.reply(minimumThresholdError(thresholdConfig));
        } else if (defenseTimerConfig && defenseTimerConfig < 1) {
          return interaction.reply(minimumDefenseTimerError(defenseTimerConfig));
        } else if (thresholdConfig > 2147483647) {
          return interaction.reply(maximumThresholdError(thresholdConfig));
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
}

module.exports = new ConfigCommand();