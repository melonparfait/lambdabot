import * as fs from 'fs';
import neatCSV = require('csv-parser');
import { Clue } from '../models/clue';

export class ClueManager {
  /** The client's clue set */
  data: Clue[];

  generateClueIndex(): number {
    return Math.floor(Math.random() * this.data.length);
  }

  loadClues() {
    const results: Clue[] = [];
    fs.createReadStream('./data.csv')
      .pipe(neatCSV(['Lower', 'Higher']))
      .on('data', (data) => results.push(data))
      .on('end', () => this.data = results);
  }
}