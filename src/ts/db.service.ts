import * as sqlite3 from 'sqlite3';

const genPerformanceTable = `CREATE TABLE IF NOT EXISTS performances(
  perf_id BIGINT UNSIGNED PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  game_id BIGINT UNSIGNED NOT NULL,
  team TINYINT NOT NULL)`;
const genGamesTable = `CREATE TABLE IF NOT EXISTS games(
  game_id BIGINT UNSIGNED PRIMARY KEY,
  channel_id BIGINT UNSIGNED NOT NULL,
  team1_score INT UNSIGNED NOT NULL,
  team2_score INT UNSIGNED NOT NULL)`;
const genScoresTable = `CREATE TABLE IF NOT EXISTS scores(
  perf_id BIGINT UNSIGNED PRIMARY KEY,
  perfect INT UNSIGNED DEFAULT 0,
  bullseye INT UNSIGNED DEFAULT 0,
  strong INT UNSIGNED DEFAULT 0,
  medium INT UNSIGNED DEFAULT 0,
  miss INT UNSIGNED DEFAULT 0)`;

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
              .run(genGamesTable)
              .run(genScoresTable);
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
}