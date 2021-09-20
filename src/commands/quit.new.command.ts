import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { ClueManager } from '../clue-manager';
import { DBService } from '../db.service';
import { GameManager } from '../game-manager';
import { Command } from '../helpers/lambda.interface';
import { couldNotUnPin, noActiveGameMessage } from '../helpers/print.gameinfo';

export class QuitCommand implements Command {
  isRestricted = false;
  cooldown = 5;
  hasChannelCooldown = true;
  isGuildOnly = true;
  data = new SlashCommandBuilder()
    .setName('quit')
    .setDescription('Stops the current game')
    .setDefaultPermission(true);
  async execute(interaction: CommandInteraction,
    gameManager: GameManager) {

    if (!gameManager.hasGame(interaction.channelId)) {
      return interaction.reply(noActiveGameMessage);
    } else {
      const game = gameManager.getGame(interaction.channelId);
      game.endGame();
      gameManager.removeGame(interaction.channelId);
      try {
        await game.pinnedInfo.unpin();
      } catch (err) {
        interaction.channel.send(couldNotUnPin);
        console.log(err);
      }
      return interaction.reply(this.stoppedGameMsg);
    }
  }

  stoppedGameMsg = 'I stopped the current game.';
}

module.exports = new QuitCommand();
