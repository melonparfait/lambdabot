import { LambdabotCommand } from '../helpers/lambda.interface';
import { checkGamePhase } from '../helpers/command.errorchecks';
import { clueGiverOnly, currentClue, gameNotInProgress, noActiveGameMessage, updateGameInfo } from '../helpers/print.gameinfo';
import { SlashCommandBuilder, userMention } from '@discordjs/builders';
import { ChatInputCommandInteraction, TextBasedChannel } from 'discord.js';
import { Game } from '../models/game';

export class ClueCommand extends LambdabotCommand {
  isRestricted = false;
  cooldown = 5;
  hasChannelCooldown = true;
  isGuildOnly = true;
  data = new SlashCommandBuilder()
    .setName('clue')
    .setDescription('Gives a clue to your allies')
    .addStringOption(option => option.setName('clue')
      .setDescription('The clue')
      .setRequired(true));
  async execute(interaction: ChatInputCommandInteraction) {
    const game = this.gameManager.getGame(interaction.channelId);
    if (!game || game.status === 'finished') {
      return await interaction.reply(noActiveGameMessage);
    } else if (!checkGamePhase(game, 'playing')) {
      return await interaction.reply(gameNotInProgress);
    } else if (interaction.user.id !== game.clueGiver()) {
      return await interaction.reply(clueGiverOnly);
    } else {
      game.currentClue = interaction.options.getString('clue', true);
      await interaction.reply(this.replyMsg(interaction.user.id, game));
      await updateGameInfo(<TextBasedChannel>interaction.channel, this.gameManager);
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
