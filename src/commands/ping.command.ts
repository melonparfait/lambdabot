import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { LambdabotCommand } from '../helpers/lambda.interface';

export class PingCommand extends LambdabotCommand {
  isRestricted = true;
  hasChannelCooldown = true;
  isGuildOnly = true;
  cooldown = 5;
  data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong?');
  async execute(interaction: CommandInteraction) {
    return interaction.reply('Pong?');
  }
}

module.exports = new PingCommand();