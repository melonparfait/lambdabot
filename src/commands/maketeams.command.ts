import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';
import { LambdabotCommand } from '../helpers/lambda.interface';
import { assignmentAlgorithms, assignmentResponses, gameAlreadyExists, noActiveGameMessage, updateGameInfoForInteraction } from '../helpers/print.gameinfo';

class MakeTeamsCommand extends LambdabotCommand {
  isRestricted = false;
  cooldown = 2;
  hasChannelCooldown = true;
  isGuildOnly = true;
  data = new SlashCommandBuilder()
    .setName('maketeams')
    .setDescription('assigns players to teams')
    .addStringOption(option => option.setName('assignmentmode')
      .setDescription('Choose how to assign players to a team. (Options: random)')
      .setRequired(true)
      .addChoices(
        { name: 'random', value: assignmentAlgorithms.random }
    ))
    .addStringOption(option => option.setName('reset')
      .setDescription('Reset teams before assignment?')
      .setRequired(true)
      .addChoices( 
        { name: 'Reset teams', value: 'reset' },
        { name: 'Don\'t reset teams', value: 'no_reset' }
    ));

  async execute (interaction: ChatInputCommandInteraction) {
    const game = this.gameManager.getGame(interaction.channelId);
    if (!game || game.status === 'finished') {
      return interaction.reply(noActiveGameMessage);
    } else if (game.status === 'playing') {
      return interaction.reply(gameAlreadyExists);
    } else {
      const arg = interaction.options.getString('assignmentmode', true);

      if (!Object.keys(assignmentAlgorithms).includes(arg)) {
        return interaction.reply(this.invalidArgument(arg));
      }

      if (interaction.options.getString('reset', true) === 'reset') {
        game.resetTeams();
      }

      switch(arg) {
        case assignmentAlgorithms.random:
          game.assignRandomTeams();
          break;
        default:
          return interaction.reply(this.invalidArgument(arg));
      }

      await interaction.reply(assignmentResponses[arg]);
      await updateGameInfoForInteraction(this.gameManager, interaction);
    }
  };

  invalidArgument(arg: string): InteractionReplyOptions {
    return {
      content: `Sorry, ${arg} isn't a valid argument. Please use \`random\`.`,
      ephemeral: true
    }
  }
}

module.exports = new MakeTeamsCommand();