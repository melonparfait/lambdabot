import { Command } from '../helpers/lambda.interface';
import { remove } from 'lodash';
import { alreadyInGame, gameInProgress, noActiveGameMessage, updateGameInfo } from '../helpers/print.gameinfo';
import { SlashCommandBuilder, userMention } from '@discordjs/builders';
import { CommandInteraction, InteractionReplyOptions } from 'discord.js';
import { GameManager } from '../game-manager';

export class JoinCommand implements Command {
  isRestricted = false;
  cooldown = 5;
  hasChannelCooldown = true;
  isGuildOnly = true;
  data = new SlashCommandBuilder()
    .setName('join')
    .setDescription('Joins the current game. If a team number argument is provided, joins that team.')
    .addStringOption(option => option.setName('team')
      .setDescription('Which team to join. Can be 1, 2, or random.')
      .setRequired(false))
    .setDefaultPermission(true);
  async execute(interaction: CommandInteraction, gameManager: GameManager) {
    const game = gameManager.getGame(interaction.channelId);
    const userId = interaction.user.id;
    if (!game || game.status === 'finished') {
      return interaction.reply(noActiveGameMessage);
    } else if (game.status !== 'setup') {
      // TODO: allow joining an in-progress game
      return interaction.reply(gameInProgress);
    } else {
      let teamArg = interaction.options.getString('team', false);

      if (teamArg) {
        if (!['1', '2', 'random'].includes(teamArg)) {
          return interaction.reply(this.invalidTeamArgument(teamArg));
        } else if (teamArg === 'random') {
          teamArg = (Math.round(Math.random()) + 1).toString();
        } else if ((game.team1.players.includes(userId) && teamArg === '1')
            || (game.team2.players.includes(userId) && teamArg === '2')) {
          return interaction.reply(this.alreadyOnTeam(teamArg));
        }

        const newPlayer = game.join(userId);
        game.addPlayerToTeam(userId, teamArg as '1' | '2');

        updateGameInfo(interaction.channel, gameManager);
        return interaction.reply(this.teamJoinedMsg(newPlayer, userId, teamArg));
      } else if (game.join(userId)) {
        updateGameInfo(interaction.channel, gameManager);
        return interaction.reply(this.userJoinedGame(userId));
      } else {
        return interaction.reply(alreadyInGame);
      }
    }
  }

  alreadyOnTeam(teamArg: string): InteractionReplyOptions {
    return {
      content: `You're already on team ${teamArg}!`,
      ephemeral: true
    }
  }

  invalidTeamArgument(teamArg: string): InteractionReplyOptions {
    return {
      content: `Sorry, ${teamArg} is not a valid team. Please try again with 1, 2, or random.`,
      ephemeral: true
    };
  }

  userJoinedGame(userId: string): string {
    return `${userMention(userId)} joined the game!`;
  }

  teamJoinedMsg(newPlayer: boolean, userId: string, team: string): string {
    return `${userMention(userId)} joined ${newPlayer ? 'the game on team' : 'team'} ${team}.`
  }
}

module.exports = new JoinCommand();