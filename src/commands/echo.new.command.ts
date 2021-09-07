import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { Command } from '../helpers/lambda.interface';

class EchoCommand implements Command {
  isRestricted = true;
  cooldown = 5;
  hasChannelCooldown = true;
  isGuildOnly = false;
  data = new SlashCommandBuilder()
    .setName('echo')
    .setDescription('Echo!')
    .addStringOption(option => option.setName('input')
      .setDescription('Enter a string to echo')
      .setRequired(true))
    .setDefaultPermission(true);
  async execute(interaction: CommandInteraction) {
    const arg = interaction.options.getString('input');
    return interaction.reply(arg);
  }
}

module.exports = new EchoCommand();