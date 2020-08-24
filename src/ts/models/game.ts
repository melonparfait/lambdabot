import { GameTeam } from './team';
import { Round } from './round';
import { Message } from 'discord.js';
import { GameSettings } from './game.settings';
import { shuffleArray } from '../helpers/shufflearray';
import { GamePhase } from '../helpers/lambda.interface';
import { isUndefined } from 'lodash';
import { ScoringResults, OffenseScore } from './scoring.results';

const DEFAULT_SETTINGS: GameSettings = {
  threshold: 'default',
  asyncPlay: false,
  oGuessTime: 180 * 1000,
  dGuessTime: 120 * 1000
}

export class Game {
  players: string[] = [];
  status: GamePhase = 'setup';
  team1: GameTeam;
  team2: GameTeam;
  clueCounter: number;
  round: Round;
  currentClue: string;
  pinnedInfo: Message;

  private _settings: GameSettings;
  get threshold(): number {
    if (this._settings.threshold === 'default') {
      return Math.floor(this.players.length / 2) * 5;
    } else {
      return this._settings.threshold;
    }
  }
  get asyncPlay(): boolean {
    return this._settings.asyncPlay;
  }
  get dGuessTime(): number {
    return this._settings.dGuessTime;
  }

  constructor(settings?: GameSettings) {
    if (isUndefined(settings)) {
      this._settings = DEFAULT_SETTINGS;
    } else {
      this.setSettings(settings);
    }
    this.resetTeams();
  }

  /**
   * Adds the `userId` to the game. This does not assign them to a team.
   * @return `true` if the player was added to the game, `false` otherwise.
   */
  join(userId: string): boolean {
    if (!this.players.includes(userId)) {
      this.players.push(userId);
      return true
    } else {
      return false
    }
  }

  /** Clears both teams in the game */
  resetTeams() {
    if (this.status === 'setup') {
      this.team1 = new GameTeam();
      this.team2 = new GameTeam();
    }
  }

  setSettings(settings: GameSettings) {
    this._settings.threshold = settings.threshold ?? DEFAULT_SETTINGS.threshold;
    this._settings.asyncPlay = settings.asyncPlay ?? DEFAULT_SETTINGS.asyncPlay;
    this._settings.dGuessTime = settings.dGuessTime ?? DEFAULT_SETTINGS.dGuessTime;
  }

  start() {
    if (this._settings.threshold === 'default') {
      this._settings.threshold = this.threshold;
    }
    this.status = 'playing'
    this.clueCounter = 0;
    this.newRound();
  }

  endGame() {
    this.status = 'finished';
  }

  newRound() {
    if (this.clueCounter % 2 === 0) {
      this.round = new Round(this.team1, this.team2);
    } else {
      this.round = new Round(this.team2, this.team1);
    }
  }

  endRound() {
    this.currentClue = undefined;
    if (this.clueCounter % 2 === 0) {
      this.team1.clueGiverCounter++;
    } else {
      this.team2.clueGiverCounter++;
    }
    this.clueCounter++;
  }

  /** 
   * Scores the current round and returns the scoring results.
   * @param scoreDefense Whether or not to score the defense guess
   */
  score(scoreDefense = true): ScoringResults {
    let oResult: OffenseScore;
    let dResult = false;
    let t1Pts: number;
    let t2Pts: number;
    const dCorrect = ((this.round.value > this.round.oGuess) && this.round.dGuess)
      || ((this.round.value < this.round.oGuess) && !this.round.dGuess);

    const delta = Math.abs(this.round.oGuess - this.round.value);
    if (delta <= 2) {
      oResult = OffenseScore.bullseye;
    } else {
      if (delta <= 5) {
        oResult = OffenseScore.strong;
      } else if (delta <= 10) {
        oResult = OffenseScore.medium;
      }
      if (scoreDefense && dCorrect) {
        dResult = true;
      }
    }

    if (this.offenseTeamNumber() === 1) {
      t1Pts = oResult;
      t2Pts = dResult ? 1 : 0;
    } else {
      t1Pts = dResult ? 1 : 0;
      t2Pts = oResult;
    }
    this.team1.points += t1Pts;
    this.team2.points = t2Pts
      ? this.team2.points + 1
      : this.team2.points;

    return {
      offenseResult: oResult,
      defenseResult: scoreDefense && dCorrect,
      team1PointChange: t1Pts,
      team2PointChange: t2Pts
    };
  }

  determineWinner(): 'Team 1' | 'Team 2' | false {
    const team1Won = this.team1.points >= this._settings.threshold;
    const team2Won = this.team2.points >= this._settings.threshold;
    if (team1Won && !team2Won) {
      return 'Team 1';
    } else if (team2Won && !team1Won) {
      return 'Team 2';
    } else if (team1Won && team2Won) {
      if (this.team1.points > this.team2.points) {
        return 'Team 1';
      } else if (this.team1.points < this.team2.points) {
        return 'Team 2';
      }
    }
    return false;
  }

  reset() {
    this.players = [];
    this.status = 'setup';
    this.team1 = undefined;
    this.team2 = undefined;
    this.clueCounter = 0;
    this.round = undefined;
  }

  offenseTeamNumber(): number {
    return (this.clueCounter % 2) + 1;
  }

  offenseTeam(): GameTeam {
    if (this.offenseTeamNumber() === 1) {
      return this.team1;
    } else {
      return this.team2;
    }
  }

  defenseTeamNumber(): number {
    if (this.offenseTeamNumber() === 1) {
      return 2;
    } else {
      return 1;
    }
  }

  defenseTeam(): GameTeam {
    if (this.offenseTeamNumber() === 1) {
      return this.team2;
    } else {
      return this.team1;
    }
  }

  clueGiver(): string {
    if (this.offenseTeamNumber() === 1) {
      return this.team1.clueGiver();
    } else {
      return this.team2.clueGiver();
    }
  }

  assignRandomTeams() {
    if (this.players.length > 1) {
      shuffleArray(this.players);
      const splitIndex = this.players.length / 2;
      this.players.forEach((userId, index) => {
        if (index < splitIndex) {
          this.team1.players.push(userId);
        } else {
          this.team2.players.push(userId);
        }
      });
    } else {
      if (Math.random() > 0.5) {
        this.team1.players.push(this.players[0]);
      } else {
        this.team2.players.push(this.players[0]);
      }
    }
  }
}
