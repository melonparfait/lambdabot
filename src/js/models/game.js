export class Game {
    players = [];
    status = 'team_formation';
    team1;
    team2;

    constructor() { }

    join(userId) {
        if (!this.players.includes(userId)) {

        }
    }

    start() {
        this.status = 'playing'
    }

    end() {
        this.status = 'finished';
    }
}