import { Game } from '../models/game';
import { Command } from '../helpers/lambda.interface';
import { gameInfo } from '../helpers/print.gameinfo';
import { SlashCommandBuilder, userMention } from '@discordjs/builders';
import { CommandInteraction, Message } from 'discord.js';
import { GameManager } from '../game-manager';
import { ClueManager } from '../clue-manager';

class NewGameCommand implements Command {
  isRestricted = false;
  cooldown?: 5;
  hasChannelCooldown = true;
  isGuildOnly = true;
  data = new SlashCommandBuilder()
    .setName('newgame')
    .setDescription('Starts a new game of Wavelength')
    .setDefaultPermission(true);
  async execute(interaction: CommandInteraction, gameManager: GameManager, clueManager: ClueManager) {
    let gameContext: Game;
    const channelId = interaction.channelId;
    if (gameManager.hasGame(channelId)) {
      gameContext = gameManager.getGame(channelId);
      switch (gameContext.status) {
        case 'setup':
        case 'playing':
          return interaction.reply({
            content: 'It looks like there\'s already a game running in this channel.',
            ephemeral: true
          });
        case 'finished':
          gameManager.addGame(channelId,
            new Game(channelId, clueManager.data, {
              threshold: gameContext.threshold,
              asyncPlay: gameContext.asyncPlay,
              oGuessTime: 180 * 1000,
              dGuessTime: gameContext.dGuessTime,
              trackStats: gameContext.trackStats
            }));
          break;
        default:
          return interaction.reply({
            content: 'There was an error processing that command.',
            ephemeral: true
          });
      }
    } else {
      gameManager.addGame(channelId, new Game(channelId, clueManager.data));
      gameContext = gameManager.getGame(channelId);
    }

    gameContext.join(interaction.user.id);

    try {
      const msg = await interaction.channel.send(gameInfo(gameContext));
      await msg.pin();
      gameContext.pinnedInfo = msg;
    } catch(err) {
      interaction.channel.send('I couldn\'t pin the game info to this channel. Do I have permission to manage messages on this channel?');
      console.log(err);
    }

    return interaction.reply(`${userMention(interaction.user.id)} started a new Wavelength game! Use \`/join\` to get in!`);
  }
}

module.exports = new NewGameCommand();