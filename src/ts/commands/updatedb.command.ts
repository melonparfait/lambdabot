import { DiscordMessage } from '../helpers/lambda.interface';

export const name = 'updatedb';
export const aliases = [];
export const cooldown = 1;
export const description = 'updates the database';
export const guildOnly = false;
export const usage = '';
export function execute(message: DiscordMessage, args: string[]) {
  message.client.dbService.db.all('SELECT * FROM games INNER JOIN performances ON games.game_id = performances.game_id', (err, row) => {
    if (err) {
      message.reply(`Error executing SQL command: ${args[0]}\nError: ${err.message}`);
    } else {
      console.log(row);
      let msg = '';
      row.forEach(entry => {
        try {
          Object.keys(entry).forEach(key => msg += `${key}: ${entry[key]}\n`);
        } catch (err) {
          console.log(err);
        }
      });
      console.log(msg);
      // message.channel.send(msg);
    }
  });

  // message.client.dbService.updateDatabase(
  //   ['player1', 'player2'],
  //   ['player3', 'player4'],
  //   'game5',
  //   'channel1',
  //   5,
  //   10,
  //   new Map([
  //     ['player1', new Map([
  //       [5, 1],
  //       [4, 1],
  //       [3, 0],
  //       [2, 1],
  //       [0, 0]
  //     ])],
  //     ['player2', new Map([
  //       [5, 0],
  //       [4, 0],
  //       [3, 1],
  //       [2, 0],
  //       [0, 2]
  //     ])],
  //     ['player3', new Map([
  //       [5, 1],
  //       [4, 1],
  //       [3, 0],
  //       [2, 0],
  //       [0, 1]
  //     ])],
  //     ['player4', new Map([
  //       [5, 0],
  //       [4, 1],
  //       [3, 0],
  //       [2, 1],
  //       [0, 0]
  //     ])]
  //   ])
  // );
}