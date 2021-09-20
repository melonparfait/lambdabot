import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, InteractionReplyOptions } from 'discord.js';
import { ClueManager } from '../clue-manager';
import { DBService } from '../db.service';
import { GameManager } from '../game-manager';
import { Command, DiscordMessage } from '../helpers/lambda.interface';
import { gameAlreadyExists, noActiveGameMessage, roster, updateGameInfo } from '../helpers/print.gameinfo';

class MakeTeamsCommand implements Command {
  isRestricted = false;
  cooldown = 2;
  hasChannelCooldown = true;
  isGuildOnly = true;
  data = new SlashCommandBuilder()
    .setName('maketeams')
    .setDescription('assigns players to teams')
    .setDefaultPermission(true)
    .addStringOption(option => option.setName('assignmentmode')
      .setDescription('Choose how to assign players to a team. (Options: random)')
      .setRequired(true))
    .addBooleanOption(option => option.setName('reset')
      .setDescription('Reset teams before assignment?')
      .setRequired(true));
  async execute (interaction: CommandInteraction, gameManager: GameManager) {
    const game = gameManager.getGame(interaction.channelId);
    if (!game || game.status === 'finished') {
      return interaction.reply(noActiveGameMessage);
    } else if (game.status === 'playing') {
      return interaction.reply(gameAlreadyExists);
    } else {
      const arg = interaction.options.getString('assignmentmode', true);

      if (!['random'].includes(arg)) {
        return interaction.reply(this.invalidArgument(arg));
      }

      if (interaction.options.getBoolean('reset', true)) {
        game.resetTeams();
      }

      switch(arg) {
        case 'random':
          game.assignRandomTeams();
          break;
        default:
          return interaction.reply(this.invalidArgument(arg));
      }

      updateGameInfo(interaction.channel, gameManager);
      return interaction.reply(roster(game));
    }
  };

  invalidArgument(arg: string): InteractionReplyOptions {
    return {
      content: `Sorry, ${arg} isn't a valid argument. Please use either \`random\` or \`resetrandom\`.`,
      ephemeral: true
    }
  }
}

module.exports = new MakeTeamsCommand();