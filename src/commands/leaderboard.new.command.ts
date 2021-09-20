import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, InteractionReplyOptions, UserManager } from 'discord.js';
import { ClueManager } from '../clue-manager';
import { DBService } from '../db.service';
import { GameManager } from '../game-manager';
import { Command, DiscordMessage } from '../helpers/lambda.interface';
import { errorProcessingCommand } from '../helpers/print.gameinfo';
import { printLeaderboard, trimLeaderboard } from '../helpers/print.leaderboard';
import { PlayerStats } from '../helpers/print.stats';

export class LeaderboardCommand implements Command {
  isRestricted = false;
  cooldown = 5;
  hasChannelCooldown = true;
  isGuildOnly = true;
  data = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Reports the leaderboard for this channel by either wins, win%, avg, or perfect')
    .addStringOption(option => option.setName('metric')
      .setDescription('Either wins, win%, avg, or perfect')
      .setRequired(true))
    .setDefaultPermission(true);
  async execute(interaction: CommandInteraction, gameManager: GameManager,
      clueManager: ClueManager, userManager: UserManager, dbService: DBService) {
    const metric = interaction.options.getString('metric');

    if (!['wins', 'win%', 'avg', 'perfect'].includes(metric)) {
      return interaction.reply(this.invalidArgumentMsg);
    }
    let channelPlayers: string[];

    try {
      channelPlayers = await dbService.getChannelPlayers(interaction.channelId);
    } catch (err) {
      console.log(`Failed to get channel players: ${err}`);
      return interaction.reply(errorProcessingCommand);
    }

    const statQuery: Promise<PlayerStats>[] = [];
    let playerStats: PlayerStats[];
    try {
      channelPlayers.forEach(player => {
        statQuery.push(dbService.getPlayerStats(player, interaction.channelId));
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

  invalidArgumentMsg: InteractionReplyOptions = {
    content: 'I am only tracking leaderboards for `wins`, `win%`, `avg`, and `perfect`.\n\
      `wins`: Number of times player has been on the winning side of a game\n\
      `win%`: Win/Loss ratio for the player\n\
      `avg`: Average number of points the player scores for their team when they are a clue giver\n\
      `perfect`: Number of times player has given a clue that their team guessed perfectly',
    ephemeral: true
  }

  noTrackedStats = 'No games with tracked stats have been played yet on this channel. Start a new one with `/newgame`!'
}

module.exports = new LeaderboardCommand();
