export class Team {
    points = 0;
    players = []
    clueGiverCounter = 0;

    constructor() { }

    clueGiver() {
        return this.players[this.clueGiverCounter % (this.players.length)];
    }
}