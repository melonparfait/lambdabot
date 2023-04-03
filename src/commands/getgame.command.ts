import { LambdabotCommand } from '../helpers/lambda.interface';
import { ChatInputCommandInteraction } from 'discord.js';
import { noGameInChannel } from '../helpers/print.gameinfo';
import { SlashCommandBuilder } from '@discordjs/builders';
import { pastebin_key, pastebin_user_token } from '../../keys.json';
import axios from 'axios';

export class GetGameCommand extends LambdabotCommand {
  isRestricted = true;
  cooldown = 0;
  hasChannelCooldown = false;
  isGuildOnly = true;
  data = new SlashCommandBuilder()
    .setName('getgame')
    .setDescription('gets game data')
    .addChannelOption(option => option.setName('channel')
        .setDescription('Channel ID for the game to edit')
        .setRequired(true));
  async execute(interaction: ChatInputCommandInteraction) {
    const channelId = interaction.options.getChannel('channel')?.id ?? 'INVALID_CHANNEL';
    if (!this.gameManager.hasGame(channelId)) {
      return await interaction.reply(noGameInChannel(channelId));
    }

    await interaction.reply({
      content: 'Sending info to pastebin...',
      ephemeral: true
    });

    const gameData = this.gameManager.getGame(channelId);
    const serializedData = JSON.stringify(gameData);

    try {
      const response = await axios.post('https://pastebin.com/api/api_post.php', {
        'api_dev_key': pastebin_key,
        'api_option': 'paste',
        'api_paste_name': `wlgame_${gameData.id}`,
        'api_user_key': pastebin_user_token,
        'api_paste_code': serializedData,
        'api_paste_private': 1,
        'api_paste_format': 'json',
        'api_paste_expire_date': '1H',
      }, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return await interaction.followUp({
        content: `Successfully sent data to pastebin: ${response.data}`,
        ephemeral: true
      });
    } catch (error) {
      console.log(error);
      return await interaction.followUp({
        content: 'Unable to send data to pastebin.',
        ephemeral: true
      });
    }
  }
}

module.exports = new GetGameCommand();
