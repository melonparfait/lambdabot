import { Game } from '../models/game';
import { LambdabotCommand } from '../helpers/lambda.interface';
import { couldNotPin, errorProcessingCommand, gameAlreadyExists, gameInfo, newGameStarted } from '../helpers/print.gameinfo';
import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, CommandInteraction, Message } from 'discord.js';
import { GameManager } from '../services/game-manager';
import { ClueManager } from '../services/clue-manager';

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

    await interaction.reply(gameInfo(gameContext));
    const msg = await interaction.fetchReply() as Message;
    try {
      await msg.pin();
      gameContext.pinnedInfo = msg;
    } catch(err) {
      this.gameManager.removeGame(interaction.channelId);
      try {
        return interaction.followUp(couldNotPin);
      } catch (err) {
        console.log('application error: ', err);
      }
    }

    return interaction.followUp(newGameStarted(interaction.user.id));
  }
}

module.exports = new NewGameCommand();