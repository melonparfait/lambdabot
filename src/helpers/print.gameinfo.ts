import { isEmpty } from 'lodash';
import { Game } from '../models/game';
import { Round } from '../models/round';
import { GameManager } from '../services/game-manager';
import { bold, channelMention, userMention } from '@discordjs/builders';
import { APIEmbedField, EmbedBuilder, InteractionReplyOptions, TextBasedChannel } from 'discord.js';

export const clueGiverOnly: InteractionReplyOptions = {
  content: 'Sorry, only the clue giver can use this command!',
  ephemeral: true
}

export const gameInProgress: InteractionReplyOptions = {
  content: 'Sorry, it looks like the game is already running.',
  ephemeral: true
};

export const gameNotInProgress: InteractionReplyOptions = {
  content: 'Sorry, it looks like the game isn\'t in progress yet.',
  ephemeral: true
}

export const noActiveGameMessage: InteractionReplyOptions = {
  content: 'No one has started a game yet. Use the `/newgame` command to start one!',
  ephemeral: true
};

export const gameAlreadyExists: InteractionReplyOptions = {
  content: 'It looks like there\'s already a game running in this channel.',
  ephemeral: true
};

export const errorProcessingCommand: InteractionReplyOptions = {
  content: 'There was an error processing that command.',
  ephemeral: true
};

export const noPermissions: InteractionReplyOptions = {
  content: 'Sorry, you don\'t have permissions to use that command!',
  ephemeral: true
};

export const setupOnly: InteractionReplyOptions = {
  content: 'Sorry, this command can only be used during game setup.',
  ephemeral: true
};

export const couldNotPin = 'I couldn\'t pin the game info to this channel. Do I have permission to manage messages on this channel?';
export const couldNotUnPin = 'I couldn\'t unpin the game info to this channel. Do I have permission to manage messages on this channel?';

export function noGameInChannel(channelId: string): InteractionReplyOptions {
  return {
    content: `No game exists in channel ${
      channelMention(channelId)}.`,
    ephemeral: true
  }
}

export function newGameStarted(byUser: string) {
  return `${userMention(byUser)} started a new Wavelength game! Use \`/join\` or the button below to get in!`;
}

export const alreadyInGame: InteractionReplyOptions = {
  content: 'Sorry, you\'re already in the game!',
  ephemeral: true
}

export function userJoinedGame(userId: string): string {
  return `${userMention(userId)} joined the game!`;
}

export function roundStatus(game: Game): string {
  return bold(`Round: ${game.roundsPlayed}`)
    + `\nTeam ${game.offenseTeamNumber()} guesses.`
    + `\n${userMention(game.round.clueGiver)} is the clue giver.`
    + `\n${clue(game.round)}`;
}

export function spectrumBar(target?: number, side?: 'higher' | 'lower'): string {
  const length = 25;
  let spectrumBar = '='.repeat(length);
  if (target) {
    const marker = Math.floor(target / 4);
    const leftSide = side === 'lower'
      ? '<'.repeat(marker)
      : spectrumBar.substring(0, marker);
    const rightSide = side === 'higher'
      ? '>'.repeat(length - marker - 1)
      : spectrumBar.substring(marker, spectrumBar.length - 1);
    spectrumBar = leftSide + `[${target}]` + rightSide;
  }
  return spectrumBar;
}

export function clue(round: Round, guess?: number): string {
  return 'The clue is:'
  + `\n${round.leftClue} 0 [${spectrumBar(guess)}] 100 ${round.rightClue}`;
}

export function currentClue(game: Game): string | undefined {
  if (game.currentClue) {
    return `${userMention(game.clueGiver())} gave this clue: ${game.currentClue}`;
  } else {
    return undefined;
  }
}

export function scoreboard(game: Game): string {
  return bold('Scoreboard')
    + '\nTeam 1'
    + `\n├─ Players: ${game.team1.players.map(id => userMention(id)).join(', ')}`
    + `\n└─ Points: ${game.team1.points}`
    + '\nTeam 2'
    + `\n├─ Players: ${game.team2.players.map(id => userMention(id)).join(', ')}`
    + `\n└─ Points: ${game.team2.points}`;
}

export async function updateGameInfo(channel: TextBasedChannel, gameManager: GameManager) {
  const game = gameManager.getGame(channel.id);

  let embed: EmbedBuilder;
  switch (game.status) {
    case 'setup':
      embed = beforeGameDetails(game);
      return await updatePin(game, embed, channel);
    case 'playing':
      embed = duringGameDetails(game);
      return await updatePin(game, embed, channel);
    case 'finished':
      embed = afterGameDetails(game);
      return await updatePin(game, embed, channel);
    default:
      return await channel.send(<string>noGameInChannel(channel.id).content);
  }
}

export async function updatePin(game: Game, embed: EmbedBuilder, channel: TextBasedChannel) {
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

export function beforeGameDetails(game: Game) {
  return new EmbedBuilder()
  .setColor(0xFF0099)
  .setTitle(`Setting up Wavelength game`)
  .setDescription('Use \`/join\` to get in!')
  .addFields(...gameSettingsEmbedFields(game))
  .addFields(
    { name: 'Team 1 Players', value: getPlayerList(game.team1.players, '1'), inline: true },
    { name: 'Team 2 Players', value: getPlayerList(game.team2.players, '2'), inline: true },
    { name: 'Unassigned Players', value: getPlayerList(game.unassignedPlayers, 'unassigned'), inline: true },
    { name: '\u200B', value: '\u200B' }
  )
  .setTimestamp();
}

export function roundStatusDescription(game: Game): string {
  let desc = `\nTeam ${game.offenseTeamNumber()} guesses.`
    + `\n${userMention(game.round.clueGiver)} is the clue giver.`
    + `\n${clue(game.round)}`;
  if (game.currentClue) {
    desc += ('\n' + currentClue(game));
  }
  return desc;
}

export function duringGameDetails(game: Game) {
  return new EmbedBuilder()
    .setColor(0xFF0099)
    .setTitle(`Wavelength Round ${game.roundsPlayed}`)
    .setDescription(roundStatusDescription(game))
    .addFields(
      { name: 'Team 1 Points', value: game.team1.points.toString(), inline: true },
      { name: 'Team 2 Points', value: game.team2.points.toString(), inline: true },
      { name: '\u200B', value: '\u200B' }
    )
    .addFields(
      { name: 'Team 1 Players', value: getPlayerList(game.team1.players, '1'), inline: true },
      { name: 'Team 2 Players', value: getPlayerList(game.team2.players, '2'), inline: true },
      { name: '\u200B', value: '\u200B' }
    )
    .addFields(...gameSettingsEmbedFields(game))
    .setTimestamp();
}

export function afterGameDetails(game: Game) {
  return new EmbedBuilder()
    .setColor(0xFF0099)
    .setTitle(`${game.determineWinner()} won!`)
    .setDescription(roundStatusDescription(game))
    .addFields(
      { name: 'Team 1 Points', value: game.team1.points.toString(), inline: true },
      { name: 'Team 2 Points', value: game.team2.points.toString(), inline: true },
      { name: '\u200B', value: '\u200B' }
    )
    .addFields(
      { name: 'Team 1 Players', value: getPlayerList(game.team1.players, '1'), inline: true },
      { name: 'Team 2 Players', value: getPlayerList(game.team2.players, '2'), inline: true },
      { name: '\u200B', value: '\u200B' }
    )
    .addFields(...gameSettingsEmbedFields(game))
    .setTimestamp();
}

export function getPlayerList(players: string[], team: '1' | '2' | 'unassigned'): string {
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

export function gameSettingsEmbedFields(game: Game): APIEmbedField[] {
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
