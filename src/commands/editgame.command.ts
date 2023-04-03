import { LambdabotCommand } from '../helpers/lambda.interface';
import { ChatInputCommandInteraction, InteractionReplyOptions, TextBasedChannel } from 'discord.js';
import { noGameInChannel, updateGameInfo } from '../helpers/print.gameinfo';
import { SlashCommandBuilder, channelMention } from '@discordjs/builders';
import { Game } from '../models/game';
import { pastebin_key, pastebin_user_token } from '../../keys.json';
import axios from 'axios';
import { PastebinGamedata } from '../models/pastebin.gamedata';

export class EditGameCommand extends LambdabotCommand {
  isRestricted = true;
  cooldown = 0;
  hasChannelCooldown = false;
  isGuildOnly = true;
  data = new SlashCommandBuilder()
    .setName('editgame')
    .setDescription('modifies a game')
    .addSubcommand(subcommand => subcommand
      .setName('withurl')
      .setDescription('Overwrites a game with specified parameters')
      .addStringOption(option => option.setName('pastebinkey')
        .setDescription('Pastebin URL for the game data')
        .setRequired(true)));
  async execute(interaction: ChatInputCommandInteraction) {
    switch (interaction.options.getSubcommand()) {
      case 'withurl':
        const pastebinKey = interaction.options.getString('pastebinkey');
        let rawData: PastebinGamedata;

        await interaction.reply({
          content: 'Retrieving data from pastebin...',
          ephemeral: true
        });

        try {
          rawData = (await axios.post('https://pastebin.com/api/api_raw.php', {
              'api_dev_key': pastebin_key,
              'api_user_key': pastebin_user_token,
              'api_paste_key': pastebinKey,
              'api_option': 'show_paste'
            },
            { headers: { 'Content-Type': 'multipart/form-data' }}
          )).data;
        } catch (error) {
          return await interaction.followUp({
            content: `Unable to retrieve data from pastebin: ${error}`,
            ephemeral: true
          })
        }

        try {
          // TODO: check if data is valid
          const channelId = rawData.channelId;
          if (!this.gameManager.hasGame(channelId)) {
            return await interaction.followUp(noGameInChannel(channelId));
          }

          const game = this.gameManager.getGame(channelId);
          game.setSettings(rawData._settings);
          game.catchupParity = rawData.catchupParity;
          game.playedClues = rawData.playedClues;
          game.status = rawData.status;
          game.team1.clueGiverCounter = rawData.team1.clueGiverCounter;
          game.team1.players = rawData.team1.players;
          game.team1.points = rawData.team1.points;
          game.team2.clueGiverCounter = rawData.team2.clueGiverCounter;
          game.team2.players = rawData.team2.players;
          game.team2.points = rawData.team2.points;
          game.roundCounter = rawData.roundCounter ?? 0;
          game.players.clear();
          rawData.team1.players.concat(rawData.team2.players).forEach(player => game.players.add(player));
          if (game.status === 'playing') { 
            game.newRound();
          }
          
          this.gameManager.addGame(channelId, game);
          await interaction.followUp(this.editedGame(channelId));
          return await updateGameInfo(<TextBasedChannel>interaction.channel, this.gameManager);
        } catch (error) {
          return await interaction.followUp(this.errorParsingGameString(error));
        }
      default:
        return await interaction.reply({
          content: 'Invalid subcommand for editing a game',
          ephemeral: true
        });
    }
  }

  editedGame(channelId: string): InteractionReplyOptions {
    return {
      content: `Updated the game in channel ${channelMention(channelId)}`,
      ephemeral: true
    }
  }
  
  errorParsingGameString(error: any): InteractionReplyOptions {
    return {
      content: `Error parsing game data from input: ${error}`,
      ephemeral: true
    }
  }
}

module.exports = new EditGameCommand();
