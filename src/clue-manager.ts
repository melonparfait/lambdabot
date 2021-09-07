import * as fs from 'fs';
import neatCSV = require('csv-parser');
import { Clue } from './models/clue';

export class ClueManager {
  /** The client's clue set */
  data: any;

  loadClues() {
    const results: Clue[] = [];
    fs.createReadStream('./data.csv')
      .pipe(neatCSV(['Lower', 'Higher']))
      .on('data', (data) => results.push(data))
      .on('end', () => this.data = results);
  }
}