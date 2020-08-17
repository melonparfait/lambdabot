import { GameTeam } from './team';
import { Round } from './round';
import { TextChannel, Team } from 'discord.js';
import { GameSettings } from './game.settings';
import { shuffleArray } from '../helpers/shufflearray';
import { GamePhase } from '../helpers/lambda.interface';

const DEFAULT_SETTINGS: GameSettings = {
  threshold: 10,
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
  winner: string;
  currentClue: string;

  private _settings: GameSettings;
  get threshold(): number {
    return this._settings.threshold;
  }
  get asyncPlay(): boolean {
    return this._settings.asyncPlay;
  }
  get dGuessTime(): number {
    return this._settings.dGuessTime;
  }

  constructor(settings?: GameSettings) {
    this._settings = settings ?? DEFAULT_SETTINGS;
    this.resetTeams();
  }

  join(userId: string) {
    if (!this.players.includes(userId)) {
      this.players.push(userId);
      return true
    } else {
      return false
    }
  }

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
    this.status = 'playing'
    this.clueCounter = 0;
    this.winner = undefined;
    this.newRound();
  }

  end() {
    this.status = 'finished';
  }

  newRound() {
    if (this.clueCounter % 2 === 0) {
      this.round = new Round(this.team1, this.team2);
    } else {
      this.round = new Round(this.team2, this.team1);
    }
  }

  endRound(channel: TextChannel, scoreDefense = true) {
    this.currentClue = undefined;
    this.score(channel, scoreDefense);
    if (this.clueCounter % 2 === 0) {
      this.team1.clueGiverCounter++;
    } else {
      this.team2.clueGiverCounter++;
    }
    this.clueCounter++;
    if (this.isOver(channel)) {
      this.end();
      return true;
    } else {
      this.newRound();
      return false;
    }
  }

  score(channel: TextChannel, scoreDefense: boolean) {
    let team1Pts = 0;
    let team2Pts = 0;

    // Offense scoring
    if (Math.abs(this.round.oGuess - this.round.value) < 3) {
      if (this.offenseTeamNumber() === 1) {
        team1Pts = 4;
      } else {
        team2Pts = 4;
      }
    } else if (Math.abs(this.round.oGuess - this.round.value) <= 5) {
      if (this.offenseTeamNumber() === 1) {
        team1Pts = 3;
      } else {
        team2Pts = 3;
      }
    } else if (Math.abs(this.round.oGuess - this.round.value) <= 10) {
      if (this.offenseTeamNumber() === 1) {
        team1Pts = 2;
      } else {
        team2Pts = 2;
      }
    }

    // Defense scoring
    if ((Math.abs(this.round.oGuess - this.round.value) > 2) && scoreDefense) {
      if (this.round.value > this.round.oGuess && this.round.dGuess) {
        if (this.offenseTeamNumber() === 2) {
          team1Pts = 1;
        } else {
          team2Pts = 1;
        }
      } else if (this.round.value < this.round.oGuess && !this.round.dGuess) {
        if (this.offenseTeamNumber() === 2) {
          team1Pts = 1;
        } else {
          team2Pts = 1;
        }
      }
    }

    this.team1.points += team1Pts;
    this.team2.points += team2Pts;
    channel.send(`Team 1 gains ${team1Pts} points! (total points: ${this.team1.points})`
      + `\nTeam 2 gains ${team2Pts} points! (total points: ${this.team2.points})`);
  }

  isOver(channel: TextChannel) {
    const team1Won = this.team1.points >= this._settings.threshold;
    const team2Won = this.team2.points >= this._settings.threshold;
    if (team1Won && !team2Won) {
      this.winner = 'Team 1';
      return true;
    } else if (team2Won && !team1Won) {
      this.winner = 'Team 2';
      return true;
    } else if (team1Won && team2Won) {
      if (this.team1.points > this.team2.points) {
        this.winner = 'Team 1'
        return true;
      } else if (this.team1.points < this.team2.points) {
        this.winner = 'Team 2'
        return true;
      } else {
        channel.send(`Wow, this is a close game! Whichever team gets a lead first wins!`)
        return false;
      }
    } else {
      return false;
    }
  }

  reset() {
    this.players = [];
    this.status = 'setup';
    this.team1 = undefined;
    this.team2 = undefined;
    this.clueCounter = 0;
    this.round = undefined;
    this.winner = undefined;
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
