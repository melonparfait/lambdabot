import { GamePhase } from '../helpers/lambda.interface'
import { Clue } from './clue'
import { GameSettings } from './game.settings'
import { GameTeam } from './team';

export interface PastebinGamedata {
  _settings: GameSettings,
  catchupParity: 0 | 1,
  channelId: string,
  clues: Clue[],
  currentClue?: string | undefined,
  id: string,
  outcomes: any,
  pinnedInfo: any,
  playedClues: number[],
  players: any,
  roundCounter?: number,
  round?: {
    clueGiver: string;
    oTeam: GameTeam;
    dTeam: GameTeam;
    leftClue: string;
    rightClue: string;
    value: number;
    oGuess: number | undefined;
    dGuess: boolean | undefined;
  },
  status: GamePhase,
  team1: {
    clueGiverCounter: number,
    players: string[],
    points: number
  },
  team2: {
    clueGiverCounter: number,
    players: string[],
    points: number
  }
}