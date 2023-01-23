import { sendNewRoundMessages } from '../helpers/newround';
import { LambdabotCommand } from '../helpers/lambda.interface';
import { ChatInputCommandInteraction, CommandInteraction, InteractionReplyOptions, TextChannel, UserManager } from 'discord.js';
import { clueGiverOnly, gameNotInProgress, noActiveGameMessage as noActiveGame, updateGameInfo } from '../helpers/print.gameinfo';
import { SlashCommandBuilder } from '@discordjs/builders';

export class SkipCommand extends LambdabotCommand {
  isRestricted = false;
  cooldown = 5;
  hasChannelCooldown = true;
  isGuildOnly = true;
  data = new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Get a new clue');
  async execute(interaction: ChatInputCommandInteraction) {
    const game = this.gameManager.getGame(interaction.channelId);
    if (!game) {
      return interaction.reply(noActiveGame);
    } else if (game.status !== 'playing') {
      return interaction.reply(gameNotInProgress);
    } else if (interaction.user.id !== game.clueGiver()) {
      return interaction.reply(clueGiverOnly);
    } else if (game.round.oGuess) {
      return interaction.reply(this.noSkipAfterGuess);
    } else {
      game.round.generateNewValue();
      const msgToReply = await sendNewRoundMessages(interaction,
        game, this.clueManager, this.lambdaClient.users);
      return interaction.reply(msgToReply);
    }
  }

  noSkipAfterGuess: InteractionReplyOptions = {
    content: 'Sorry, your team already made a guess, so you can\'t skip anymore!',
    ephemeral: true
  }
}

module.exports = new SkipCommand();
