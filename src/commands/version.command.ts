import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, CommandInteraction } from 'discord.js';
import { LambdabotCommand } from '../helpers/lambda.interface';
import { version } from '../../package.json';

export class VersionCommand extends LambdabotCommand {
  isRestricted = true;
  cooldown = 0;
  hasChannelCooldown = true;
  isGuildOnly = false;
  data = new SlashCommandBuilder()
    .setName('version')
    .setDescription('Displays version information for this bot');
  async execute(interaction: ChatInputCommandInteraction) {
    return await interaction.reply(`λ-bot version: ${version}`);
  }
}

export default new VersionCommand();