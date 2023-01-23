import { LambdabotCommand } from '../helpers/lambda.interface';
import { printStats } from '../helpers/print.stats';
import { isUndefined } from 'lodash';
import { SlashCommandBuilder } from '@discordjs/builders';
import { ChannelType, ChatInputCommandInteraction } from 'discord.js';

export class StatsCommand extends LambdabotCommand {
  isRestricted = false;
  cooldown = 3;
  hasChannelCooldown = true;
  isGuildOnly = false;
  data = new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Reports stats for a player')
    .addStringOption(option => option.setName('global')
      .setDescription('Whether to report stats across all channels or not')
      .setRequired(true)
      .addChoices(
        { name: 'Get global stats', value: 'yes'},
        { name: 'Report stats only for this channel', value: 'no' }
      ))
    .addUserOption(option => option.setName('player')
      .setDescription('Player to report stats about')
      .setRequired(false));
  async execute(interaction: ChatInputCommandInteraction) {
    let isGlobal = interaction.options.getString('global');
    let player = interaction.options.getUser('player', false) ?? interaction.user ;
    let channel = isGlobal === 'yes' ? undefined : interaction.channelId;
    if (interaction.channel?.type !== ChannelType.GuildText && isGlobal !== 'yes') {
      return interaction.reply(this.channelStatsOnlyForGuild);
    }

    const stats = await this.dbService.getPlayerStats(player.id, channel);
    return interaction.reply({
      content: printStats(stats, !isUndefined(channel)),
      allowedMentions: { parse: [] }
    });
  }

  channelStatsOnlyForGuild = 'Sorry, you can only view channel stats in a server.';
}

module.exports = new StatsCommand();
