import * as sqlite3 from 'sqlite3';
import { PlayerStats } from './helpers/print.stats';
import { OffenseScore } from './models/scoring.results';

const genPerformanceTable = `CREATE TABLE IF NOT EXISTS performances(
  user_id BIGINT UNSIGNED NOT NULL,
  game_id BIGINT UNSIGNED NOT NULL,
  team TINYINT NOT NULL,
  perfect INT UNSIGNED DEFAULT 0,
  bullseye INT UNSIGNED DEFAULT 0,
  strong INT UNSIGNED DEFAULT 0,
  medium INT UNSIGNED DEFAULT 0,
  miss INT UNSIGNED DEFAULT 0,
  PRIMARY KEY(user_id, game_id),
  FOREIGN KEY (game_id)
    REFERENCES games (game_id))`;
const genGamesTable = `CREATE TABLE IF NOT EXISTS games(
  game_id BIGINT UNSIGNED PRIMARY KEY,
  channel_id BIGINT UNSIGNED NOT NULL,
  team1_score INT UNSIGNED NOT NULL,
  team2_score INT UNSIGNED NOT NULL)`;

export class DBService {
  private _connected = false;
  get connected(): boolean {
    return this._connected;
  }

  db: sqlite3.Database;
  constructor() {}

  connect() {
    if (this._connected) {
      console.log('Already connected to a database.');
      return;
    }

    this.db = new sqlite3.Database('./db/data.db',
      err => {
        if (err) {
          console.log(`Unable to establish connection to database: ${err}`);
        } else {
          this._connected = true;
          console.log('Connected to database!');
          this.db.parallelize(() => {
            this.db.run(genPerformanceTable)
              .run(genGamesTable);
          });
        }
      });
  }

  disconnect() {
    if (this._connected) {
      this.db.close(err => {
        if (err) {
          console.log('Error closing the database: ', err);
        } else {
          this._connected = false;
          console.log('Closed the database');
        }
      });
    }
  }

  updateDatabase(team1: string[],
    team2: string[],
    gameId: string,
    channelId: string,
    team1Score: number,
    team2Score: number,
    outcomes: Map<string, Map<number, number>>) {
    this.db.serialize(() => {
      console.log('Running SQL command:\n', this.updateGamesTable(gameId, channelId, team1Score, team2Score));
      console.log('Running SQL command:\n', this.updatePerformanceTable(team1, team2, gameId, outcomes));
      this.db.run(this.updateGamesTable(gameId, channelId, team1Score, team2Score),
        err => {
          if (err) console.log('Error updating games table: ', err);
        }).run(this.updatePerformanceTable(team1, team2, gameId, outcomes),
        err => {
          if (err) console.log('Error updating performance table: ', err);
        });
    });
  }

  updatePerformanceTable(team1: string[],
    team2: string[],
    gameId: string,
    outcomes: Map<string, Map<number, number>>): string {

    let values = '';
    team1.forEach(player => values += `('${player}', '${gameId}', ${1},\
      ${outcomes.get(player).get(5)},\
      ${outcomes.get(player).get(OffenseScore.bullseye)},\
      ${outcomes.get(player).get(OffenseScore.strong)},\
      ${outcomes.get(player).get(OffenseScore.medium)},\
      ${outcomes.get(player).get(OffenseScore.miss)}),`.replace(/[^,]\s+/g, ' '));
    team2.forEach(player => values += `('${player}', '${gameId}', ${2},\
      ${outcomes.get(player).get(5)},\
      ${outcomes.get(player).get(OffenseScore.bullseye)},\
      ${outcomes.get(player).get(OffenseScore.strong)},\
      ${outcomes.get(player).get(OffenseScore.medium)},\
      ${outcomes.get(player).get(OffenseScore.miss)}),`.replace(/[^,]\s+/g, ' '));
    values = values.substring(0, values.length - 1);
    return `INSERT INTO performances (user_id, game_id, team, perfect, bullseye, strong, medium, miss)
      VALUES ${values}`;
  }

  updateGamesTable(gameId: string, channelId: string, team1Score: number, team2Score: number): string {
    return `INSERT INTO games (game_id, channel_id, team1_score, team2_score)
      VALUES ('${gameId}', '${channelId}', ${team1Score}, ${team2Score})`;
  }

  getChannelPlayers(channel: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`SELECT DISTINCT user_id 
        FROM games INNER JOIN performances
        ON games.game_id = performances.game_id
        WHERE channel_id = "${channel}"`, (err, rows) => {
        if (err) {
          console.log('Error querying the database: ', err);
          reject('Failed to query the database');
        } else {
          resolve(rows.map(entry => entry.user_id));
        }
      });
    });
  }

  getPlayerStats(playerId: string, channel?: string): Promise<PlayerStats> {
    const stats: PlayerStats = {
      id: playerId,
      gamesPlayed: 0,
      gamesWon: 0,
      cluesGiven: 0,
      perfects: 0,
      '4pts': 0,
      '3pts': 0,
      '2pts': 0,
      '0pts': 0
    };

    let query = `SELECT games.game_id, team1_score, team2_score, team, perfect, bullseye, strong, medium, miss
      FROM games INNER JOIN performances
      ON games.game_id = performances.game_id
      WHERE user_id = "${playerId}"`;

    if (channel) {
      query += `AND channel_id = "${channel}"`;
    }

    return new Promise((resolve, reject) => {
      this.db.all(query, (err, rows) => {
        if (err) {
          console.log('Error querying the database: ', err);
          reject('Failed to query the database');
        } else {
          stats.gamesPlayed = rows.length;
          rows.forEach(entry => {
            const otherTeam = entry.team == 1 ? 2 : 1;
            if (entry[`team${entry.team}_score`] > entry[`team${otherTeam}_score`]) {
              stats.gamesWon++;
            }
            stats.perfects += entry.perfect;
            stats['4pts'] += entry.bullseye;
            stats['3pts'] += entry.strong;
            stats['2pts'] += entry.medium;
            stats['0pts'] += entry.miss;
            stats.cluesGiven += (entry.bullseye + entry.strong + entry.medium + entry.miss);
          });
          resolve(stats);
        }
      });
    });
  }
}