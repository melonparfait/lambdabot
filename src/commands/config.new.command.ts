import { Command, DiscordMessage } from '../helpers/lambda.interface';
import { checkForGame, checkGamePhase } from '../helpers/command.errorchecks';
import { gameSettings, noActiveGameMessage, updateGameInfo } from '../helpers/print.gameinfo';
import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
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
      return interaction.reply({
        content: 'Sorry, this command can only be used during game setup.',
        ephemeral: true
      });
    } else {
      try {
        asyncConfig = interaction.options.getBoolean('async', true);
        trackStatsConfig = interaction.options.getBoolean('trackstats', true);
        thresholdConfig = interaction.options.getInteger('threshold') ?? 'default';
        defenseTimerConfig = interaction.options.getInteger('defensetimer');

        if (thresholdConfig < 4) {
          return interaction.reply({
            content: `Sorry, the minimum threshold is 4 points. (You tried to set it to ${thresholdConfig}.)`,
            ephemeral: true
          });
        } else if (defenseTimerConfig && defenseTimerConfig < 1) {
          return interaction.reply({
            content: `Sorry, the minimum defense timer is 1 second. (You tried to set it to ${defenseTimerConfig}.)`,
            ephemeral: true
          });
        } else if (thresholdConfig > 2147483647) {
          return interaction.reply({
            content: `Sorry, that threshold (${thresholdConfig}) is too big. please give me a smaller number.`,
            ephemeral: true
          });
        }
        // conversion to seconds
        defenseTimerConfig = defenseTimerConfig * 1000;

      } catch (err) {
        interaction.reply({
          content: `Sorry, there was an error processing that command: ${err}`,
          ephemeral: true
        });
      }
    }

    gameManager.getGame(channelId).setSettings({
      threshold: thresholdConfig,
      asyncPlay: asyncConfig,
      oGuessTime: 0,
      dGuessTime: defenseTimerConfig,
      trackStats: trackStatsConfig
    });

    updateGameInfo(interaction.channel, gameManager);
    return interaction.reply('Changed the settings to:\n'
      + gameSettings(gameManager.getGame(channelId)));
  }
}

module.exports = new ConfigCommand();