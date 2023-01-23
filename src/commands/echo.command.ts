import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, CommandInteraction } from 'discord.js';
import { LambdabotCommand } from '../helpers/lambda.interface';

export class EchoCommand extends LambdabotCommand {
  isRestricted = true;
  cooldown = 5;
  hasChannelCooldown = true;
  isGuildOnly = false;
  data = new SlashCommandBuilder()
    .setName('echo')
    .setDescription('Echo!')
    .addStringOption(option => option.setName('input')
      .setDescription('Enter a string to echo')
      .setRequired(true));
  async execute(interaction: ChatInputCommandInteraction) {
    const arg = interaction.options.getString('input', true);
    return interaction.reply(arg);
  }
}

module.exports = new EchoCommand();