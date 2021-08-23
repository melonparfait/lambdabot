import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, Interaction } from 'discord.js';
import { DiscordMessage, NewCommand } from '../helpers/lambda.interface';

class EchoCommand implements NewCommand {
  name = 'echo';
  aliases = [];
  cooldown = 5;
  channelCooldown = true;
  description = 'Echo!';
  guildOnly = false;
  usage = '<text>';
  args = true;
  data = new SlashCommandBuilder()
    .setName('echo')
    .setDescription('Echo!')
    .addStringOption(option => option.setName('input')
      .setDescription('Enter a string to echo')
      .setRequired(true));
  async execute(interaction: CommandInteraction) {
    const arg = interaction.options.getString('input');
    return interaction.reply(arg);
  }
}

module.exports = new EchoCommand();