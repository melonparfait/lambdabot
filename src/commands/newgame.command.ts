import { Game } from '../models/game';
import { LambdabotCommand, ComponentCustomId } from '../helpers/lambda.interface';
import { errorProcessingCommand, gameAlreadyExists, newGameStarted, unableToUpdateGameInfo, updateGameInfoForInteraction } from '../helpers/print.gameinfo';
import { ActionRowBuilder, ButtonBuilder, SlashCommandBuilder } from '@discordjs/builders';
import { ButtonStyle, ChatInputCommandInteraction, ComponentType, TextBasedChannel } from 'discord.js';

export class NewGameCommand extends LambdabotCommand {
  isRestricted = false;
  cooldown?: 5;
  hasChannelCooldown = true;
  isGuildOnly = true;
  data = new SlashCommandBuilder()
    .setName('newgame')
    .setDescription('Starts a new game of Wavelength');
  async execute(interaction: ChatInputCommandInteraction) {
    let gameContext: Game;
    const channelId = interaction.channelId;
    if (this.gameManager.hasGame(channelId)) {
      gameContext = this.gameManager.getGame(channelId);
      switch (gameContext.status) {
        case 'setup':
        case 'playing':
          return interaction.reply(gameAlreadyExists);
        case 'finished':
          this.gameManager.addGame(channelId,
            new Game(channelId, this.clueManager.data, undefined, {
              threshold: gameContext.threshold,
              asyncPlay: gameContext.asyncPlay,
              oGuessTime: 180 * 1000,
              dGuessTime: gameContext.dGuessTime,
              trackStats: gameContext.trackStats
            }));
          break;
        default:
          return interaction.reply(errorProcessingCommand);
        }
    } else {
      this.gameManager.addGame(channelId, new Game(channelId, this.clueManager.data));
    }

    gameContext = this.gameManager.getGame(channelId);
    gameContext.join(interaction.user.id);
    await interaction.reply({
      content: 'Starting game...',
      ephemeral: true
    });

    const joinButtonRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(ComponentCustomId.JoinButton)
          .setLabel('Join')
          .setStyle(ButtonStyle.Primary)
      );

    try {
      await updateGameInfoForInteraction(this.gameManager, interaction);
    } catch (error) {
      return await interaction.followUp(unableToUpdateGameInfo);
    }
    return await interaction.channel?.send({
      content: newGameStarted(interaction.user.id),
      components: [joinButtonRow]
    });
  }
}

module.exports = new NewGameCommand();