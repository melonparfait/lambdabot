export class Round {
    clueGiver;
    oTeam;
    dTeam;
    leftClue;
    rightClue;
    value;
    oGuess;
    dGuess;

    constructor(oTeam, dTeam) {
        this.clueGiver = oTeam.clueGiver();
        this.oTeam = oTeam;
        this.dTeam = dTeam;
        this.generateNewValue();
    }

    makeOGuess(guess) {
        this.oGuess = guess;
    }

    makeDGuess(guess) {
        this.dGuess = guess;
    }

    generateNewValue() {
        this.value = Math.floor(Math.random() * 100) + 1;
    }
}
