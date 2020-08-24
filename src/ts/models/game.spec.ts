import { describe } from 'mocha';
import { Game } from '../models/game';
import { Round } from '../models/round';
import { GameTeam } from '../models/team';
import { expect } from 'chai';
import { DEFAULT_SETTINGS } from './game.settings';

let game: Game;

describe.only('Game model tests', () => {
  afterEach(() => game = undefined);

  describe('Initialization tests', () => {
    beforeEach(() => {
      game = new Game();
    });

    it('should initialize', () => {
      expect(game).to.exist;
      expect(game.team1).to.exist;
      expect(game.team2).to.exist;
      expect(game.status).to.equal('setup');
    });

    it('should initialize a game with default settings', () => {
      expect(game.threshold).to.equal(0);
      expect(game.asyncPlay).to.equal(DEFAULT_SETTINGS.asyncPlay);
      expect(game.dGuessTime).to.equal(DEFAULT_SETTINGS.dGuessTime);
    });

    it('should initialize a game with defined settings', () => {
      const threshold = 42;
      const asyncPlay = true;
      const dGuessTime = 100;
      const oGuessTime = 99;
      game = new Game({ threshold, asyncPlay, dGuessTime, oGuessTime });

      expect(game.threshold).to.equal(threshold);
      expect(game.asyncPlay).to.equal(asyncPlay);
      expect(game.dGuessTime).to.equal(dGuessTime);
    });
  });

  describe('config tests', () => {
    it('should set settings properly', () => {
      game = new Game();
      expect(game.threshold).to.equal(0);
      expect(game.asyncPlay).to.equal(DEFAULT_SETTINGS.asyncPlay);
      expect(game.dGuessTime).to.equal(DEFAULT_SETTINGS.dGuessTime);

      const threshold = 42;
      const asyncPlay = true;
      const dGuessTime = 100;
      const oGuessTime = 99;
      game.setSettings({ threshold, asyncPlay, dGuessTime, oGuessTime });
      
      expect(game.threshold).to.equal(threshold);
      expect(game.asyncPlay).to.equal(asyncPlay);
      expect(game.dGuessTime).to.equal(dGuessTime);
    });
    
    describe('threshold tests', () => {
      beforeEach(() => {
        game = new Game();
      });

      it('should calculate the threshold correctly for balanced teams', () => {
        game.team1.players.push('1', '2', '3');
        game.team2.players.push('1', '2', '3');
        expect(game.threshold).to.equal(15);
      });
      
      it('should calculate the threshold correctly for unbalanced teams', () => {
        game.team1.players.push('1', '2');
        game.team2.players.push('1', '2', '3', '4');
        expect(game.threshold).to.equal(20);
      });
    });
  });

  describe('After starting the game', () => {
    beforeEach(() => {
      game = new Game();
      game.team1.players.push('1', '2', '3');
      game.team2.players.push('4', '5', '6');
      game.start();
    });

    it('should set the proper game state', () => {
      expect(game.status === 'playing');
      expect(game.clueCounter === 0);
    });

    describe('offense defense determination tests', () => {
      it('should have Team 1 as offense and Team 2 as defense on even rounds', () => {
        game.clueCounter = 0;
        expect(game.offenseTeamNumber()).to.equal(1);
        expect(game.offenseTeam().players).to.have.ordered.members(['1', '2', '3']);
        expect(game.defenseTeamNumber()).to.equal(2);
        expect(game.defenseTeam().players).to.have.ordered.members(['4', '5', '6']);
      });

      it('should have Team 1 as defense and Team 2 as offense on even rounds', () => {
        game.clueCounter = 1;
        expect(game.defenseTeamNumber()).to.equal(1);
        expect(game.defenseTeam().players).to.have.ordered.members(['1', '2', '3']);
        expect(game.offenseTeamNumber()).to.equal(2);
        expect(game.offenseTeam().players).to.have.ordered.members(['4', '5', '6']);
      });
    });
  });
});