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
  	const bucket = Math.random();
  	if (bucket >= 0.68) {
  	  this.value = Math.ceil(this.skewnormal2(0, 1, 0.35, 3) * 100);
    } else if (bucket <= 0.32) {
    	this.value = Math.ceil((1 - this.skewnormal2(0, 1, 0.35, 3)) * 100);
    } else {
    	this.value = Math.ceil(this.normalWithCenter(4.2) * 100);
    }
  }

  private normal() {
    return Math.sqrt(-2.0 * Math.log(Math.random())) * Math.cos(2.0 * Math.PI * Math.random());
  }

  private normalWithCenter(sigma = 6, center = 0.5) {
    while (true) {
      let num = this.normal() / sigma + 0.0 + center;
      if (0 <= num && num <= 1) return num;
    }
  }

  private skewnormal2(min: number, max: number, skew = 1, sigma = 8, center = 0.5) {
    let num = this.normalWithCenter(sigma, center);
    num = Math.pow(num, skew);
    num *= max - min;
    num += min;
    return num;
  }
}
