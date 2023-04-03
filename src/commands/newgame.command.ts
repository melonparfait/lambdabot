import { Game } from '../models/game';
import { LambdabotCommand } from '../helpers/lambda.interface';
import { errorProcessingCommand, gameAlreadyExists, newGameStarted, updateGameInfo } from '../helpers/print.gameinfo';
import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, TextBasedChannel } from 'discord.js';

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
    await updateGameInfo(<TextBasedChannel>interaction.channel, this.gameManager);
    return await interaction.followUp(newGameStarted(interaction.user.id));
  }
}

module.exports = new NewGameCommand();