import { GameTeam } from './team';

export class Round {
  clueGiver: string;
  leftClue: string;
  rightClue: string;
  value: number;
  oGuess: number | undefined;
  dGuess: boolean | undefined;

  constructor(public oTeam: GameTeam, public dTeam: GameTeam, newValue = true) {
    this.clueGiver = oTeam.clueGiver();
    if (newValue) {
      this.generateNewValue();
    }
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
