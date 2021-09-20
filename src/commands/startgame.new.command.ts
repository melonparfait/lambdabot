import { Command, DiscordMessage } from '../helpers/lambda.interface';
import { CommandInteraction, TextChannel, UserManager } from 'discord.js';
import { gameAlreadyExists, gameInfo, gameSettings, noActiveGameMessage, roster, roundStatus } from '../helpers/print.gameinfo';
import { SlashCommandBuilder } from '@discordjs/builders';
import { GameManager } from '../game-manager';
import { sendNewRoundMessages } from '../helpers/newround';
import { ClueManager } from '../clue-manager';

export class StartGameCommand implements Command {
  isRestricted = false;
  cooldown = 5;
  hasChannelCooldown = true;
  isGuildOnly = true;
  data = new SlashCommandBuilder()
    .setName('start')
    .setDescription('Starts the game using the current teams.')
    .setDefaultPermission(true);
  async execute(interaction: CommandInteraction,
      gameManager: GameManager, clueManager: ClueManager, userManager: UserManager) {
    const game = gameManager.getGame(interaction.channelId);
    if (!game) {
      return interaction.reply(noActiveGameMessage);
    } else if (game.status === 'playing') {
      return interaction.reply(gameAlreadyExists);
    } else {
      const teamCheckReply = 'We need at least 2 players on each team to start a game.';
      const team1NeedsMorePlayers = game.team1.players.length < 2 ?
        `Team 1 has ${game.team1.players.length} players.` : false;
      const team2NeedsMorePlayers = game.team2.players.length < 2 ?
        `Team 2 has ${game.team2.players.length} players.` : false;
      if (team1NeedsMorePlayers || team2NeedsMorePlayers) {
        return interaction.reply(teamCheckReply
          + `\n${team1NeedsMorePlayers}`
          + `\n${team2NeedsMorePlayers}`);
      } else {
        game.start();
        sendNewRoundMessages(interaction, game, clueManager, userManager);
      }
    }
  }
}
