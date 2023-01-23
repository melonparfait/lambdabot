import { DiscordMessage, LambdabotCommand } from '../helpers/lambda.interface';
import { ChatInputCommandInteraction, CommandInteraction, TextChannel, UserManager } from 'discord.js';
import { gameAlreadyExists, gameInfo, gameSettings, noActiveGameMessage, roster, roundStatus } from '../helpers/print.gameinfo';
import { SlashCommandBuilder } from '@discordjs/builders';
import { sendNewRoundMessages } from '../helpers/newround';

export class StartGameCommand extends LambdabotCommand {
  isRestricted = false;
  cooldown = 5;
  hasChannelCooldown = true;
  isGuildOnly = true;
  data = new SlashCommandBuilder()
    .setName('start')
    .setDescription('Starts the game using the current teams.');

  async execute(interaction: ChatInputCommandInteraction) {
    const game = this.gameManager.getGame(interaction.channelId);
    if (!game) {
      return interaction.reply(noActiveGameMessage);
    } else if (game.status === 'playing') {
      return interaction.reply(gameAlreadyExists);
    } else {
      const team1Difference = Math.max(2 - game.team1.players.length, 0);
      const team2Difference = Math.max(2 - game.team2.players.length, 0);
      if (team1Difference || team2Difference) {
        return interaction.reply(this.insufficientPlayersMessage(team1Difference, team2Difference));
      } else {
        game.start();
        const msgToSend = await sendNewRoundMessages(interaction, game, this.clueManager,
          this.lambdaClient.users);
        interaction.reply(msgToSend);
      }
    }
  }

  insufficientPlayersMessage(team1Difference: number, team2Difference: number) {
    if (team1Difference && team2Difference) {
      return 'We need at least 2 players on each team to start a game.'
        + `\nTeam 1 needs ${team1Difference} more player(s).`
        + `\nTeam 2 needs ${team2Difference} more player(s).`
    } else if (team1Difference) {
      return 'We need at least 2 players on each team to start a game.'
        + `\nTeam 1 needs ${team1Difference} more player(s).`
    } else {
      return 'We need at least 2 players on each team to start a game.'
        + `\nTeam 2 needs ${team2Difference} more player(s).`
    }
  }
}

module.exports = new StartGameCommand();
