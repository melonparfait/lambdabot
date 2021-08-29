import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { Command } from '../helpers/lambda.interface';

class PingCommand implements Command {
  isRestricted = true;
  hasChannelCooldown = true;
  isGuildOnly = true;
  cooldown = 5;
  data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong?')
    .setDefaultPermission(false);
  async execute(interaction: CommandInteraction) {
    await interaction.reply('Pong?');
  }
}

module.exports = new PingCommand();