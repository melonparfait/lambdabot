import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, Interaction } from 'discord.js';
import { DiscordMessage, NewCommand } from '../helpers/lambda.interface';

class PingCommand implements NewCommand {
  name = 'ping';
  aliases = [];
  cooldown = 5;
  channelCooldown = true;
  description = 'Ping!';
  guildOnly = true;
  args = false;
  usage = 'Replies with Pong?';
  data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong?');
  async execute(interaction: CommandInteraction) {
    await interaction.reply('Pong?');
  }
}

module.exports = new PingCommand();