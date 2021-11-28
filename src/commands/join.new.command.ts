import { Command } from '../helpers/lambda.interface';
import { remove } from 'lodash';
import { gameInProgress, noActiveGameMessage, updateGameInfo } from '../helpers/print.gameinfo';
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
    .setDescription('Join the current game')
    .addStringOption(option => option.setName('team')
      .addChoices([
        ['Team 1', '1'],
        ['Team 2', '2'],
        ['Random', 'random'],
        ['Neither team', 'no_team'],
      ])
      .setDescription('Which team to join.')
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
        if (teamArg === 'random') {
          teamArg = (Math.round(Math.random()) + 1).toString();
        } else if ((game.team1.players.includes(userId) && teamArg === '1')
            || (game.team2.players.includes(userId) && teamArg === '2')) {
          return interaction.reply(this.alreadyOnTeam(teamArg));
        } else if (teamArg === 'no_team' && game.unassignedPlayers.includes(userId)) {
          return interaction.reply(this.alreadyInGame);
        }
        const newPlayer = game.join(userId);
        const prevTeam = game.team1.players.includes(userId) ? '1'
          : game.team2.players.includes(userId) ? '2'
          : 'Unassigned';

        if (teamArg === '1' || teamArg === '2') {
          game.addPlayerToTeam(userId, teamArg);
        } else if (teamArg === 'no_team') {
          game.movePlayerToUnassignedTeam(userId);
        }

        const msg = teamArg === 'no_team'
          ? newPlayer
            ? this.userJoinedGame(userId)
            : this.userLeftTeam(userId, prevTeam)
          : this.teamJoinedMsg(newPlayer, userId, teamArg);
        await interaction.reply(msg);
        await updateGameInfo(interaction.channel, gameManager);
      } else if (game.join(userId)) {
        await interaction.reply(this.userJoinedGame(userId));
        await updateGameInfo(interaction.channel, gameManager);
      } else {
        return interaction.reply(this.alreadyInGame);
      }
    }
  }

  alreadyInGame: InteractionReplyOptions = {
    content: 'Sorry, you\'re already in the game!',
    ephemeral: true
  }

  alreadyOnTeam(teamArg: string): InteractionReplyOptions {
    return {
      content: `You're already on team ${teamArg}!`,
      ephemeral: true
    }
  }

  userJoinedGame(userId: string): string {
    return `${userMention(userId)} joined the game!`;
  }

  userLeftTeam(userId: string, teamNumber: string): string {
    return `${userMention(userId)} left Team ${teamNumber}.`;
  }

  teamJoinedMsg(newPlayer: boolean, userId: string, team: string): string {
    return `${userMention(userId)} joined ${newPlayer ? 'the game on team' : 'team'} ${team}.`
  }
}

module.exports = new JoinCommand();