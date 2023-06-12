import { ButtonInteraction, TextBasedChannel } from 'discord.js';
import { LambdabotComponentHandler, ComponentCustomId } from '../helpers/lambda.interface';
import { alreadyInGame, gameInProgress, noActiveGameMessage, updateGameInfoForInteraction, userJoinedGame } from '../helpers/print.gameinfo';

export class JoinButtonHandler extends LambdabotComponentHandler {
  componentId = ComponentCustomId.JoinButton;

  async handleCommand(interaction: ButtonInteraction) {
    const gameManager = this.lambdaClient.gameManager;
    const game = gameManager.getGame(interaction.channelId);
    const userId = interaction.user.id;
    if (!game || game.status === 'finished') {
      return interaction.reply(noActiveGameMessage);
    } else if (game.status !== 'setup') {
      // TODO: allow joining an in-progress game
      return interaction.reply(gameInProgress);
    } else {
      if (game.join(userId)) {
        await interaction.reply(userJoinedGame(userId));
        await updateGameInfoForInteraction(gameManager, interaction);
      } else {
        return interaction.reply(alreadyInGame);
      }
    }
  }
}

module.exports = new JoinButtonHandler();