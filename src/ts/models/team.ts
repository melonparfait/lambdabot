export class GameTeam {
    points = 0;
    players: string[] = [];
    clueGiverCounter = 0;

    constructor() { }

    clueGiver(): string {
        return this.players[this.clueGiverCounter % (this.players.length)];
    }
}