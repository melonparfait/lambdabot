import { Team } from './team';
import { Round } from './round';

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

export class Game {
    players = [];
    status = 'team_formation';
    team1;
    team2;
    clueCounter;
    round;
    winner;
    victoryThreshold;

    constructor(threshold) {
        this.victoryThreshold = threshold;
    }

    join(userId) {
        if (!this.players.includes(userId)) {
            this.players.push(userId);
            return true
        } else {
            return false
        }
    }

    createTeams() {
        if (this.status === 'team_formation') {
            this.team1 = new Team();
            this.team2 = new Team();
            
            // TODO: Other ways of creating teams
            this.assignRandomTeams();
        }
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

    endRound(channel, scoreDefense = true) {
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

    score(channel, scoreDefense) {
        let team1Pts = 0;
        let team2Pts = 0;

        // Offense scoring
        if (Math.abs(this.round.oGuess - this.round.value) < 3) {
            if (this.guessingTeam() === 1) {
                team1Pts = 4;
            } else {
                team2Pts = 4;
            }
        } else if (Math.abs(this.round.oGuess - this.round.value) <= 5) {
            if (this.guessingTeam() === 1) {
                team1Pts = 3;
            } else {
                team2Pts = 3;
            }
        } else if (Math.abs(this.round.oGuess - this.round.value) <= 10) {
            if (this.guessingTeam() === 1) {
                team1Pts = 2;
            } else {
                team2Pts = 2;
            }
        }

        // Defense scoring
        if ((Math.abs(this.round.oGuess - this.round.value) > 2) && scoreDefense) {
            if (this.round.value > this.round.oGuess && this.round.dGuess) {
                if (this.guessingTeam() === 2) {
                    team1Pts = 1;
                } else {
                    team2Pts = 1;
                }
            } else if (this.round.value < this.round.oGuess && !this.round.dGuess) {
                if (this.guessingTeam() === 2) {
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

    isOver(channel) {
        const team1Won = this.team1.points >= this.victoryThreshold;
        const team2Won = this.team2.points >= this.victoryThreshold;
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
        this.status = 'team_formation';
        this.team1 = undefined;
        this.team2 = undefined;
        this.clueCounter = 0;
        this.round = undefined;
        this.winner = undefined;
    }

    guessingTeam() {
        return (this.clueCounter % 2) + 1;
    }

    otherTeam() {
        if (this.guessingTeam() === 1) {
            return 2;
        } else {
            return 1;
        }
    }

    assignRandomTeams() {
        shuffleArray(this.players);
        const splitIndex = this.players.length / 2;
        this.players.forEach((userId, index) => {
            if (index < splitIndex) {
                this.team1.players.push(userId);
            } else {
                this.team2.players.push(userId);
            }
        });
    }
}
