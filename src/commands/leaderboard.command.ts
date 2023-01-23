import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, CommandInteraction, InteractionReplyOptions, UserManager } from 'discord.js';
import { ClueManager } from '../services/clue-manager';
import { DBService } from '../services/db.service';
import { GameManager } from '../services/game-manager';
import { LambdabotCommand } from '../helpers/lambda.interface';
import { errorProcessingCommand } from '../helpers/print.gameinfo';
import { printLeaderboard, trimLeaderboard } from '../helpers/print.leaderboard';
import { PlayerStats } from '../helpers/print.stats';

export class LeaderboardCommand extends LambdabotCommand {
  isRestricted = false;
  cooldown = 5;
  hasChannelCooldown = true;
  isGuildOnly = true;
  data = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Reports the leaderboard for this channel by either wins, win%, avg, or perfect')
    .addStringOption(option => option.setName('metric')
      .setDescription('Either wins, win%, avg, or perfect')
      .setRequired(true)
      .addChoices(
        { name: 'Number of wins', value: 'wins' },
        { name: 'Percentage of games won', value: 'win%' },
        { name: 'Average score as clue giver', value: 'avg' },
        { name: 'Number of perfect clues as clue giver', value: 'perfect' },
      ));

  async execute(interaction: ChatInputCommandInteraction) {
    const metric = interaction.options.getString('metric', true);
    let channelPlayers: string[];

    try {
      channelPlayers = await this.dbService.getChannelPlayers(interaction.channelId);
    } catch (err) {
      console.log(`Failed to get channel players: ${err}`);
      return interaction.reply(errorProcessingCommand);
    }

    const statQuery: Promise<PlayerStats>[] = [];
    let playerStats: PlayerStats[];
    try {
      channelPlayers.forEach(player => {
        statQuery.push(this.dbService.getPlayerStats(player, interaction.channelId));
      });
      playerStats = await Promise.all(statQuery);
    } catch (err) {
      console.log(`Failed to get player stats: ${err}`);
      return interaction.reply(errorProcessingCommand);
    }

    if (playerStats.length === 0) {
      return interaction.reply(this.noTrackedStats);
    }
    let msg = printLeaderboard(playerStats, metric);
    while (msg.length > 2000) {
      msg = trimLeaderboard(msg);
    }
    return interaction.reply({ content: msg, allowedMentions: { parse: [] } });
  }

  noTrackedStats = 'No games with tracked stats have been played yet on this channel. Start a new one with `/newgame`!'
}

module.exports = new LeaderboardCommand();
