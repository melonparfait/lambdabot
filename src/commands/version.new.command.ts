import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { Command } from '../helpers/lambda.interface';
import { version } from '../../package.json';

class VersionCommand implements Command {
  isRestricted = true;
  cooldown?: 0;
  hasChannelCooldown = true;
  isGuildOnly = false;
  data = new SlashCommandBuilder()
    .setName('version')
    .setDescription('Displays version information for this bot');
  async execute(interaction: CommandInteraction) {
    await interaction.reply(`λ-bot version: ${version}`);
  }
}

module.exports = new VersionCommand();