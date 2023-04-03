import { clueGiverPrompt, createNewCluePrompt, unableToDMClueGiver } from '../helpers/newround';
import { LambdabotCommand } from '../helpers/lambda.interface';
import { ChatInputCommandInteraction, CommandInteraction, InteractionReplyOptions, TextBasedChannel, TextChannel, UserManager } from 'discord.js';
import { clueGiverOnly, couldNotPin, gameInfo, gameNotInProgress, noActiveGameMessage as noActiveGame, roundStatus, updateGameInfo } from '../helpers/print.gameinfo';
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
      return await interaction.reply(noActiveGame);
    } else if (game.status !== 'playing') {
      return await interaction.reply(gameNotInProgress);
    } else if (interaction.user.id !== game.clueGiver()) {
      return await interaction.reply(clueGiverOnly);
    } else if (game.round.oGuess) {
      return await interaction.reply(this.noSkipAfterGuess);
    } else {
      game.round.generateNewValue();
      createNewCluePrompt(game, this.clueManager);
      await interaction.reply(roundStatus(game));
      await updateGameInfo(<TextBasedChannel>interaction.channel, this.gameManager);

      const clueGiver = await this.lambdaClient.users.fetch(game.round.clueGiver);
      try {
        return await clueGiver.send(clueGiverPrompt(game));
      } catch (error) {
        console.error(`Could not send the clue to ${clueGiver.tag}.\n`, error);
        return await interaction.followUp(unableToDMClueGiver(clueGiver));
      }
    }
  }

  noSkipAfterGuess: InteractionReplyOptions = {
    content: 'Sorry, your team already made a guess, so you can\'t skip anymore!',
    ephemeral: true
  }
}

module.exports = new SkipCommand();
