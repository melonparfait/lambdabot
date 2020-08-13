import { describe } from 'mocha';
import { Game } from '../models/game';
import { gameSettings, clue } from './print.gameinfo';
import { Round } from '../models/round';
import { Team } from 'discord.js';
import { GameTeam } from '../models/team';

describe('Printing output tests', () => {
  it('should print the game settings', () => {
    const game = new Game();
  });

  it.only('should print the clue', () => {
    const team1 = new GameTeam();
    const team2 = new GameTeam();
    const round = new Round(team1, team2);
    round.leftClue = "foo";
    round.rightClue = "bar"
    console.log(clue(round, 30));
  });
})