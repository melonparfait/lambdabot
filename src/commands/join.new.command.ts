import { Command } from '../helpers/lambda.interface';
import { remove } from 'lodash';
import { noActiveGameMessage, updateGameInfo } from '../helpers/print.gameinfo';
import { SlashCommandBuilder, userMention } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
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
    if (!game || game.status === 'finished') {
      return interaction.reply(noActiveGameMessage);
    } else if (game.status !== 'setup') {
      // TODO: allow joining an in-progress game
      return interaction.reply({
        content: 'Sorry, it looks like the game is already running.',
        ephemeral: true
      });
    } else {
      let teamArg = interaction.options.getString('team', false);

      if (teamArg) {
        if (!['1', '2', 'random'].includes(teamArg)) {
          return interaction.reply({
            content: `Sorry, ${teamArg} is not a valid team. Please try again with 1, 2, or random.`,
            ephemeral: true
          });
        } else if (teamArg === 'random') {
          teamArg = (Math.round(Math.random()) + 1).toString();
        }
        let response: string;

        if (game.join(interaction.user.id)) {
          response = `${userMention(interaction.user.id)} joined the game on team `;
        } else {
          if (game.team1.players.includes(interaction.user.id)) {
            remove(game.team1.players, player => player === interaction.user.id);
          }
          if (game.team2.players.includes(interaction.user.id)) {
            remove(game.team2.players, player => player === interaction.user.id);
          }
          response = `${userMention(interaction.user.id)} joined team `;
        }

        if (teamArg === '1') {
          game.team1.players.push(interaction.user.id);
        } else {
          game.team2.players.push(interaction.user.id);
        }

        response += `${teamArg}.`;
        updateGameInfo(interaction.channel, gameManager);
        return interaction.reply(response);
      } else if (game.join(interaction.user.id)) {
        updateGameInfo(interaction.channel, gameManager);
        return interaction.reply(`${userMention(interaction.user.id)} joined the game!`);
      } else {
        return interaction.reply({
          content: 'Sorry, you\'re already in the game!',
          ephemeral: true
        });
      }
    }
  }
}

module.exports = new JoinCommand();