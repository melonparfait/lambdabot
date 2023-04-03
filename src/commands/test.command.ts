import { LambdabotCommand } from '../helpers/lambda.interface';
import { APIEmbedField, ChatInputCommandInteraction, TextBasedChannel } from 'discord.js';
import { EmbedBuilder, SlashCommandBuilder, userMention } from '@discordjs/builders';
import { Game } from '../models/game';
import { clue, couldNotPin, newGameStarted, noGameInChannel } from '../helpers/print.gameinfo';
import { isEmpty } from 'lodash';

export class TestCommand extends LambdabotCommand {
  isRestricted = true;
  cooldown = 0;
  hasChannelCooldown = false;
  isGuildOnly = true;
  data = new SlashCommandBuilder()
    .setName('test')
    .setDescription('testing embeds');

  async execute(interaction: ChatInputCommandInteraction) {
    const game = this.gameManager.getGame(interaction.channelId);
    let embed: EmbedBuilder;
    switch (game.status) {
      case 'setup':
        embed = this.beforeGameDetails(game);
        await interaction.reply({
          content: 'Updating pinned info...',
          ephemeral: true
        })
        return await this.updatePin(game, embed, <TextBasedChannel>interaction.channel);
      case 'playing':
        embed = this.duringGameDetails(game);
        await interaction.reply({
          content: 'Updating pinned info...',
          ephemeral: true
        })
        return await this.updatePin(game, embed, <TextBasedChannel>interaction.channel);
      case 'finished':
        embed = this.afterGameDetails(game);
        await interaction.reply({
          content: 'Updating pinned info...',
          ephemeral: true
        })
        return await this.updatePin(game, embed, <TextBasedChannel>interaction.channel);
      default:
        return await interaction.reply(noGameInChannel(interaction.channelId));
    }

  }

  async updatePin(game: Game, embed: EmbedBuilder, channel: TextBasedChannel) {
    if (game.pinnedInfo) {
      try {
        return await game.pinnedInfo.edit({
          embeds: [embed]
        });
      } catch (err) {
        console.log(err);
        return await channel.send(couldNotPin);
      }
    } else {
      const msg = await channel.send({
        embeds: [embed]
      });
      try {
        game.pinnedInfo = msg;
        return await msg.pin();
      } catch (err) {
        console.log(err);
        return await channel.send(couldNotPin);
      }
    }
  }

  beforeGameDetails(game: Game) {
    return new EmbedBuilder()
    .setColor(0xFF0099)
    .setTitle(`Setting up Wavelength game`)
    .setDescription('Use \`/join\` to get in!')
    .addFields(...this.gameSettings(game))
    .addFields(
      { name: 'Team 1 Players', value: this.getPlayerList(game.team1.players, '1'), inline: true },
      { name: 'Team 2 Players', value: this.getPlayerList(game.team2.players, '2'), inline: true },
      { name: '\u200B', value: '\u200B' }
    )
    .setTimestamp();
  }

  roundStatus(game: Game): string {
    return `\nTeam ${game.offenseTeamNumber()} guesses.`
      + `\n${userMention(game.round.clueGiver)} is the clue giver.`
      + `\n${clue(game.round)}`;
  }

  duringGameDetails(game: Game) {
    return new EmbedBuilder()
      .setColor(0xFF0099)
      .setTitle(`Wavelength Round ${game.roundsPlayed}`)
      .setDescription(this.roundStatus(game))
      .addFields(
        { name: 'Team 1 Points', value: game.team1.points.toString(), inline: true },
        { name: 'Team 2 Points', value: game.team2.points.toString(), inline: true },
        { name: '\u200B', value: '\u200B' }
      )
      .addFields(
        { name: 'Team 1 Players', value: this.getPlayerList(game.team1.players, '1'), inline: true },
        { name: 'Team 2 Players', value: this.getPlayerList(game.team2.players, '2'), inline: true },
        { name: 'Unassigned Players', value: this.getPlayerList(game.unassignedPlayers, 'unassigned'), inline: true },
        { name: '\u200B', value: '\u200B' }
      )
      .addFields(...this.gameSettings(game))
      .setTimestamp();
  }

  afterGameDetails(game: Game) {
    return new EmbedBuilder()
      .setColor(0xFF0099)
      .setTitle(`${game.determineWinner()} won!`)
      .setDescription(this.roundStatus(game))
      .addFields(
        { name: 'Team 1 Points', value: game.team1.points.toString(), inline: true },
        { name: 'Team 2 Points', value: game.team2.points.toString(), inline: true },
        { name: '\u200B', value: '\u200B' }
      )
      .addFields(
        { name: 'Team 1 Players', value: this.getPlayerList(game.team1.players, '1'), inline: true },
        { name: 'Team 2 Players', value: this.getPlayerList(game.team2.players, '2'), inline: true },
        { name: 'Unassigned Players', value: this.getPlayerList(game.unassignedPlayers, 'unassigned'), inline: true },
        { name: '\u200B', value: '\u200B' }
      )
      .addFields(...this.gameSettings(game))
      .setTimestamp();
  }

  getPlayerList(players: string[], team: '1' | '2' | 'unassigned'): string {
    let teamDisplay: string;
    switch (team) {
      case '1':
        teamDisplay = 'on Team 1';
        break;
      case '2':
        teamDisplay = 'on Team 2';
        break;
      case 'unassigned':
        teamDisplay = 'unassigned';
        break;
    }
    const playerList = players.reduce((prev, curr, index) => {
      let nextPlayerId = userMention(curr);
      if (index < players.length) {
        nextPlayerId += '\n';
      }
      return prev + nextPlayerId;
    }, '');
    return isEmpty(playerList) ? `No one is currently ${teamDisplay}.`: playerList;
  }

  gameSettings(game: Game): APIEmbedField[] {
    const threshold = game.isDefaultThreshold ? `default (${game.threshold})` : game.threshold;
    const thresholdField: APIEmbedField = { name: 'Points to win', value: threshold.toString(), inline: true };

    const asyncLabel = game.asyncPlay ? 'disabled' : 'enabled';
    const asyncField: APIEmbedField = { name: 'Timers', value: asyncLabel, inline: true };

    const trackStats = game.trackStats ? 'enabled' : 'disabled';
    const trackStatsField: APIEmbedField = { name: 'Track stats', value: trackStats, inline: true };

    const counterGuessField: APIEmbedField = {
      name: 'Counter guess timer',
      value: (game.dGuessTime / 1000).toString(),
      inline: true
    };

    const fields: APIEmbedField[] = [
      thresholdField,
      trackStatsField,
      asyncField
    ];

    if (!game.asyncPlay) {
      fields.push(counterGuessField)
    }

    return fields;
  }
}

module.exports = new TestCommand();
