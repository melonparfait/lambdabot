import { ScoringResults } from './scoring.results';
import { GameTeam } from './team';

export class Round {
  clueGiver: string;
  oTeam: GameTeam;
  dTeam: GameTeam;
  leftClue: string;
  rightClue: string;
  value: number;
  oGuess: number;
  dGuess: boolean;

  constructor(oTeam: GameTeam, dTeam: GameTeam) {
    this.clueGiver = oTeam.clueGiver();
    this.oTeam = oTeam;
    this.dTeam = dTeam;
    this.generateNewValue();
  }

  makeOGuess(guess: number) {
    this.oGuess = guess;
  }

  makeDGuess(guess: boolean) {
    this.dGuess = guess;
  }

  generateNewValue() {
    this.value = Math.floor(Math.random() * 100) + 1;
  }
}
