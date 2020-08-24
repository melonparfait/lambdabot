export class GameTeam {
  points = 0;
  clueGiverCounter = 0;

  constructor(public players: string[] = []) {
  }

  clueGiver(): string {
    return this.players[this.clueGiverCounter % (this.players.length)];
  }
}