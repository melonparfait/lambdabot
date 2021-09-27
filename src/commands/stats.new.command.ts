import { Command, DiscordMessage } from '../helpers/lambda.interface';
import { DBService } from '../db.service';
import { stat } from 'fs';
import { printStats } from '../helpers/print.stats';
import { isUndefined } from 'lodash';
import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, UserManager } from 'discord.js';
import { GameManager } from '../game-manager';
import { ClueManager } from '../clue-manager';

export class StatsCommand implements Command {
  isRestricted = false;
  cooldown = 3;
  hasChannelCooldown = true;
  isGuildOnly = false;
  data = new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Reports stats for a player')
    .addStringOption(option => option.setName('global')
      .addChoice('Get global stats', 'yes')
      .addChoice('Report stats only for this channel', 'no')
      .setDescription('Whether to report stats across all channels or not')
      .setRequired(true))
    .addUserOption(option => option.setName('player')
      .setDescription('Player to report stats about')
      .setRequired(false))
    .setDefaultPermission(true);
  async execute(interaction: CommandInteraction, gameManager: GameManager,
      clueManager: ClueManager, userManager: UserManager, dbService: DBService) {
    let isGlobal = interaction.options.getString('global');
    let player = interaction.options.getUser('player', false) ?? interaction.user ;
    let channel = isGlobal === 'yes' ? undefined : interaction.channelId;
    if (interaction.channel.type !== 'GUILD_TEXT' && isGlobal !== 'yes') {
      return interaction.reply(this.channelStatsOnlyForGuild);
    }

    const stats = await dbService.getPlayerStats(player.id, channel);
    return interaction.reply({
      content: printStats(stats, !isUndefined(channel)),
      allowedMentions: { parse: [] }
    });
  }

  channelStatsOnlyForGuild = 'Sorry, you can only view channel stats in a server.';
}

module.exports = new StatsCommand();
