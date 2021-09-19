import { GameTeam } from './team';
import { Round } from './round';
import { Channel, Message } from 'discord.js';
import { GameSettings, DEFAULT_SETTINGS } from './game.settings';
import { shuffleArray } from '../helpers/shufflearray';
import { GamePhase } from '../helpers/lambda.interface';
import { isUndefined, cloneDeep, remove } from 'lodash';
import { ScoringResults, OffenseScore } from './scoring.results';
import { Clue } from './clue';
import { v4 as uuidv4 } from 'uuid';

export class Game {
  private _settings: GameSettings;
  players = new Set<string>();
  status: GamePhase = 'setup';
  team1: GameTeam;
  team2: GameTeam;
  roundCounter: number;
  round: Round;
  currentClue: string;
  pinnedInfo: Message;
  playedClues: number[] = [];
  outcomes: Map<string, Map<number, number>> = new Map();

  get unassignedPlayers(): string[] {
    const players = [];
    this.players.forEach(player => {
      if (!this.team1.players.includes(player) && !this.team2.players.includes(player)) {
        players.push(player);
      }
    });
    return players;
  }

  get threshold(): number {
    if (this._settings.threshold === 'default') {
      return Math.max(Math.max(this.team1.players.length, this.team2.players.length) * 5, 5);
    } else {
      return this._settings.threshold;
    }
  }

  get isDefaultThreshold(): boolean {
    return this._settings.threshold === 'default';
  }

  get asyncPlay(): boolean {
    return this._settings.asyncPlay;
  }
  get dGuessTime(): number {
    return this._settings.dGuessTime;
  }
  get trackStats(): boolean {
    return this._settings.trackStats;
  }

  constructor(public readonly channelId: string,
      public readonly clues: Clue[],
      settings?: GameSettings,
      public readonly id?: string) {
    if (isUndefined(settings)) {
      this._settings = cloneDeep(DEFAULT_SETTINGS);
    } else {
      this._settings = cloneDeep(settings);
    }

    if (isUndefined(id)) {
      this.id = uuidv4();
    }

    this.resetTeams();
  }

  /**
   * Adds the `userId` to the game. This does not assign them to a team.
   * @return `true` if the player was added to the game, `false` otherwise.
   */
  join(userId: string): boolean {
    if (!this.players.has(userId)) {
      this.players.add(userId);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Adds a userId to a team. If the user is already on another team, they are 
   * removed and added to the specified team. If the player has not joined the
   * game yet, they are added to the game.
   * @param userId player to add to a team
   * @param team either team '1' or '2'
   */
  addPlayerToTeam(userId: string, team: '1' | '2') {
    if (!this.players.has(userId)) {
      this.players.add(userId);
    }

    if (team === '1') {
      if (this.team2.players.includes(userId)) {
        remove(this.team2.players, player => player === userId);
      }
      this.team1.players.push(userId);
    } else if (team === '2') {
      if (this.team1.players.includes(userId)) {
        remove(this.team1.players, player => player === userId);
      }
      this.team2.players.push(userId);
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
    this._settings.trackStats = settings.trackStats ?? DEFAULT_SETTINGS.trackStats;
  }

  start() {
    if (this._settings.threshold === 'default') {
      this._settings.threshold = this.threshold;
    }
    this.status = 'playing';
    this.roundCounter = 0;

    this.players.forEach(player => {
      this.outcomes.set(player, new Map());
      [...Array(6).keys()].forEach(pointValue => this.outcomes.get(player).set(pointValue, 0));
    });
    this.newRound();
  }

  endGame() {
    this.status = 'finished';
  }

  newRound() {
    if (this.offenseTeamNumber() === 1) {
      this.round = new Round(this.team1, this.team2);
    } else {
      this.round = new Round(this.team2, this.team1);
    }
  }

  addPlayedClue(clueIndex: number, clueListLength: number) {
    if (this.playedClues.length > clueListLength * 1.5) {
      this.playedClues = [];
    }
    this.playedClues.push(clueIndex);
  }

  endRound() {
    this.currentClue = undefined;
    if (this.offenseTeamNumber() === 1) {
      this.team1.clueGiverCounter++;
    } else {
      this.team2.clueGiverCounter++;
    }
    this.roundCounter++;
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
      } else {
        oResult = OffenseScore.miss;
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
    this.team2.points += t2Pts;

    const scoreResults = {
      offenseResult: oResult,
      defenseResult: dResult,
      team1PointChange: t1Pts,
      team2PointChange: t2Pts,
    };

    const currentValue = this.outcomes.get(this.round.clueGiver).get(oResult);
    this.outcomes.get(this.round.clueGiver).set(oResult, currentValue + 1);
    if (delta === 0) {
      const currentPerfects = this.outcomes.get(this.round.clueGiver).get(5);
      this.outcomes.get(this.round.clueGiver).set(5, currentPerfects + 1);
    }

    return scoreResults;
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
    this.players = new Set<string>();
    this.status = 'setup';
    this.team1 = undefined;
    this.team2 = undefined;
    this.roundCounter = 0;
    this.round = undefined;
  }

  offenseTeamNumber(): number {
    return (this.roundCounter % 2) + 1;
  }

  get offenseTeam(): GameTeam {
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

  get defenseTeam(): GameTeam {
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

  /**
   * Splits the players in the game evenly into two teams at random
   */
  assignRandomTeams() {
    const players = Array.from(this.players);
    if (this.players.size > 1) {
      shuffleArray(players);
      const splitIndex = players.length / 2;
      players.forEach((userId, index) => {
        if (index < splitIndex) {
          this.team1.players.push(userId);
        } else {
          this.team2.players.push(userId);
        }
      });
    } else if (Math.random() > 0.5) {
      this.team1.players.push(players[0]);
    } else {
      this.team2.players.push(players[0]);
    }
  }
}
