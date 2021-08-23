import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, Interaction } from 'discord.js';
import { DiscordMessage, NewCommand } from '../helpers/lambda.interface';

// export const name = 'ping';
// export const aliases = [];
// export const cooldown = 5;
// export const channelCooldown = true;
// export const description = 'Ping!';
// export const guildOnly = true;
// export const args = false;
// export const data = new SlashCommandBuilder()
//   .setName('ping')
//   .setDescription('Replies with Pong?');
// export async function execute(interaction) {
//   await interaction.reply('Pong?');
// }
// export function execute(message: DiscordMessage, args: string[]) {
//   console.log('got message: ', message);
//   message.channel.send('Pong?');
// }

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

export = PingCommand;