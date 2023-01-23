import { userMention } from '@discordjs/builders';
import { round } from 'lodash';
import { PlayerStats } from './print.stats';

export function printLeaderboard(statArray: PlayerStats[], stat: string): string {
  const ranking: Array<{value: number, players: string[]}> = [];
  let msg = `${stat.toLocaleUpperCase()} leaderboard:\n`;
  statArray.forEach(playerStat => {
    const statValue = getPlayerStat(playerStat, stat);
    const existingRank = ranking.find(rank => rank.value === statValue);
    if (existingRank) {
      existingRank.players.push(playerStat.id);
    } else {
      ranking.push({
        value: statValue,
        players: [playerStat.id]
      });
    }
  });
  ranking.sort((a, b) => b.value - a.value);
  ranking.forEach((rank, index) => {
    msg += `#${index + 1} (${rank.value}): ${rank.players.map(id => userMention(id)).join(', ')}\n`;
  });
  return msg;
}

export function trimLeaderboard(leaderboard: string) {
  const lastNewline = leaderboard.lastIndexOf('\n');
  return leaderboard.substring(0, lastNewline);
}

export function getPlayerStat(playerStat: PlayerStats, stat: 'wins' | 'win%' | 'avg' | 'perfect' | string): number {
  switch (stat) {
  case 'wins':
    return playerStat.gamesWon;
  case 'win%':
    return playerStat.gamesPlayed !== 0 ? round((playerStat.gamesWon * 100 / playerStat.gamesPlayed), 2) : 0;
  case 'avg':
    return playerStat.cluesGiven !== 0
      ? parseFloat((
        ((playerStat['4pts'] * 4) + (playerStat['3pts'] * 3) + (playerStat['2pts'] * 2))
          / playerStat.cluesGiven).toFixed(2))
      : 0;
  case 'perfect':
    return playerStat.perfects;
  default:
    console.log('Invalid stat: ', stat);
  }
}