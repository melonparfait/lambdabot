import { userMention } from '@discordjs/builders';
import { getPlayerStat } from './print.leaderboard';

export interface PlayerStats {
  id: string,
  gamesPlayed: number,
  gamesWon: number,
  cluesGiven: number,
  perfects: number,
  '4pts': number,
  '3pts': number,
  '2pts': number,
  '0pts': number
}

export function printStats(stats: PlayerStats, channel = false) {
  return `Stats for ${userMention(stats.id)}${channel ? ' in this channel' : ''}:
  Games played: ${stats.gamesPlayed}
  Games won: ${stats.gamesWon}
  W/L: ${stats.gamesPlayed !== 0 ? getPlayerStat(stats, 'win%') : '--'}%
  Clues given: ${stats.cluesGiven}
  Perfect clues: ${stats.perfects}
  4pt clues: ${stats['4pts']}
  3pt clues: ${stats['3pts']}
  2pt clues: ${stats['2pts']}
  0pt clues: ${stats['0pts']}
  Avg score: ${stats.cluesGiven !== 0 ? getPlayerStat(stats, 'avg') : '--'}`;
}
