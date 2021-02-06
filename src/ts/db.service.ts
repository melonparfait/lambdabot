import * as sqlite3 from 'sqlite3';

const genUsersTable = `CREATE TABLE IF NOT EXISTS users(
  id BIGINT UNSIGNED PRIMARY KEY,
  game_id BIGINT UNSIGNED NOT NULL,
  team BOOL NOT NULL)`;
const genGamesTable = `CREATE TABLE IF NOT EXISTS games(
  id BIGINT UNSIGNED PRIMARY KEY,
  channel_id BIGINT UNSIGNED NOT NULL,
  outcome BOOL)`;
const genScoresTable = `CREATE TABLE IF NOT EXISTS detail_score(
  game_id BIGINT UNSIGNED NOT NULL,
  player_id BIGINT UNSIGNED NOT NULL,
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
            this.db.run(genUsersTable)
              .run(genGamesTable)
              .run(genScoresTable)
              .each('', err => {
                if (err) {
                  console.log('Database error: ', err);
                  throw err;
                } else {
                  console.log(err);
                }
              });
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