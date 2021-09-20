import { Command, DiscordMessage } from '../helpers/lambda.interface';
import { checkGamePhase } from '../helpers/command.errorchecks';
import { clueGiverOnly, currentClue, gameNotInProgress, noActiveGameMessage, updateGameInfo } from '../helpers/print.gameinfo';
import { SlashCommandBuilder, userMention } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { GameManager } from '../game-manager';
import { Game } from '../models/game';

export class ClueCommand implements Command {
  isRestricted = false;
  cooldown = 5;
  hasChannelCooldown = true;
  isGuildOnly = true;
  data = new SlashCommandBuilder()
    .setName('clue')
    .setDescription('Gives a clue to your allies')
    .addStringOption(option => option.setName('clue')
      .setDescription('The clue')
      .setRequired(true))
    .setDefaultPermission(true);
  async execute(interaction: CommandInteraction, gameManager: GameManager) {
    const game = gameManager.getGame(interaction.channelId);
    if (!game || game.status === 'finished') {
      return interaction.reply(noActiveGameMessage);
    } else if (!checkGamePhase(game, 'playing')) {
      return interaction.reply(gameNotInProgress);
    } else if (interaction.user.id !== game.clueGiver()) {
      return interaction.reply(clueGiverOnly);
    } else {
      game.currentClue = interaction.options.getString('clue', true);
      updateGameInfo(interaction.channel, gameManager);
      return interaction.reply(this.replyMsg(interaction.user.id, game));
    }
  }
  replyMsg(userId: string, gameRef: Game) {
    const clueMsg = currentClue(gameRef);
    return clueMsg + `\n${gameRef.offenseTeam.players
      .filter(id => id !== userId)
      .map(id => userMention(id)).join(', ')}`;
  }
}

module.exports = new ClueCommand();
