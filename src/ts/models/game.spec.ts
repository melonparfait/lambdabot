import { describe } from 'mocha';
import { Game } from '../models/game';
import { expect } from 'chai';
import { DEFAULT_SETTINGS } from './game.settings';
import { Round } from './round';
import { GameTeam } from './team';
import { OffenseScore, ScoringResults } from './scoring.results';

let game: Game;

describe('Game model tests', () => {
  const threshold = 42;
  const asyncPlay = true;
  const dGuessTime = 100;
  const oGuessTime = 99;
  const team1Players = ['1', '2', '3'];
  const team2Players = ['4', '5', '6'];

  describe('Initialization tests', () => {
    beforeEach(() => {
      game = new Game('testGame', []);
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
      game = new Game('testGame', [], { threshold, asyncPlay, dGuessTime, oGuessTime });

      expect(game.threshold).to.equal(threshold);
      expect(game.asyncPlay).to.equal(asyncPlay);
      expect(game.dGuessTime).to.equal(dGuessTime);
    });
  });

  describe('config tests', () => {
    it('should set settings properly', () => {
      game = new Game('testGame', []);
      expect(game.threshold).to.equal(0);
      expect(game.asyncPlay).to.equal(DEFAULT_SETTINGS.asyncPlay);
      expect(game.dGuessTime).to.equal(DEFAULT_SETTINGS.dGuessTime);

      game.setSettings({ threshold, asyncPlay, dGuessTime, oGuessTime });

      expect(game.threshold).to.equal(threshold);
      expect(game.asyncPlay).to.equal(asyncPlay);
      expect(game.dGuessTime).to.equal(dGuessTime);
    });

    describe('threshold tests', () => {
      beforeEach(() => {
        game = new Game('testGame', []);
      });

      it('should calculate the threshold correctly for balanced teams', () => {
        game.team1.players.push(...team1Players);
        game.team2.players.push(...team2Players);
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
      game = new Game('testGame', []);
      game.team1.players.push(...team1Players);
      game.team2.players.push(...team2Players);
      game.start();
    });

    it('should set the proper game state', () => {
      expect(game.status === 'playing');
      expect(game.roundCounter === 0);
    });

    describe('offense defense determination tests', () => {
      it('should have Team 1 as offense and Team 2 as defense on even rounds', () => {
        game.roundCounter = 0;
        expect(game.offenseTeamNumber()).to.equal(1);
        expect(game.offenseTeam.players).to.have.ordered.members(team1Players);
        expect(game.defenseTeamNumber()).to.equal(2);
        expect(game.defenseTeam.players).to.have.ordered.members(team2Players);
      });

      it('should have Team 1 as defense and Team 2 as offense on even rounds', () => {
        game.roundCounter = 1;
        expect(game.defenseTeamNumber()).to.equal(1);
        expect(game.defenseTeam.players).to.have.ordered.members(team1Players);
        expect(game.offenseTeamNumber()).to.equal(2);
        expect(game.offenseTeam.players).to.have.ordered.members(team2Players);
      });
    });

    describe('When starting a new round', () => {
      it('should have Team 1 as the offense team for an even round', () => {
        game.roundCounter = 0;
        game.newRound();
        expect(game.round.oTeam.players).to.have.ordered.members(team1Players);
        expect(game.round.dTeam.players).to.have.ordered.members(team2Players);
      });

      it('should have Team 2 as the offense team for an odd round', () => {
        game.roundCounter = 1;
        game.newRound();
        expect(game.round.oTeam.players).to.have.ordered.members(team2Players);
        expect(game.round.dTeam.players).to.have.ordered.members(team1Players);
      });
    });

    describe('After ending a round', () => {
      it('should advance the round counter', () => {
        const counter = game.roundCounter;
        game.endRound();
        expect(game.roundCounter).to.equal(counter + 1);
      });

      it('should advance the clue giver counter on Team 1 on an even round', () => {
        const counter1 = game.team1.clueGiverCounter;
        const counter2 = game.team2.clueGiverCounter;
        game.roundCounter = 0;
        game.endRound();
        expect(game.team1.clueGiverCounter).to.equal(counter1 + 1);
        expect(game.team2.clueGiverCounter).to.equal(counter2);
      });

      it('should advance the clue giver counter on Team 2 on an odd round', () => {
        const counter1 = game.team1.clueGiverCounter;
        const counter2 = game.team2.clueGiverCounter;
        game.roundCounter = 1;
        game.endRound();
        expect(game.team1.clueGiverCounter).to.equal(counter1);
        expect(game.team2.clueGiverCounter).to.equal(counter2 + 1);
      });
    });

    describe('Scoring tests', () => {
      function makeFakeRound(oGuess: number, dGuess: boolean, value: number, roundParity: boolean) {
        let fakeRound: Round;
        if (roundParity) {
          fakeRound = new Round(new GameTeam(team1Players), new GameTeam(team2Players));
        } else {
          fakeRound = new Round(new GameTeam(team2Players), new GameTeam(team1Players));
        }
        fakeRound.oGuess = oGuess;
        fakeRound.dGuess = dGuess;
        fakeRound.value = value;
        return fakeRound;
      }

      function verifyResults(result: ScoringResults, oResult: OffenseScore, dResult: boolean, t1Delta: number, t2Delta: number) {
        expect(result.offenseResult, 'incorrect offenseResult').to.equal(oResult);
        expect(result.team1PointChange, 'incorrect team1Delta').to.equal(t1Delta);
        expect(result.defenseResult, 'incorrect defenseResult').to.equal(dResult);
        expect(result.team2PointChange, 'incorrect team2Delta').to.equal(t2Delta);
      }

      it('should score a bullseye guess properly', () => {
        game.roundCounter = 0;
        game.round = makeFakeRound(49, true, 50, true);
        const result = game.score();
        verifyResults(result, OffenseScore.bullseye, false, OffenseScore.bullseye, 0);
        expect(game.team1.points).to.equal(OffenseScore.bullseye);
        expect(game.team2.points).to.equal(0);
      });

      it('should score a strong guess properly', () => {
        game.roundCounter = 1;
        game.round = makeFakeRound(20, false, 15, false);
        const result = game.score();
        verifyResults(result, OffenseScore.strong, true, 1, OffenseScore.strong);
        expect(game.team1.points).to.equal(1);
        expect(game.team2.points).to.equal(OffenseScore.strong);
      });

      it('should score a medium guess properly', () => {
        game.roundCounter = 9;
        game.team1.points = 3;
        game.team2.points = 2;
        const t1PointsBefore = game.team1.points;
        const t2PointsBefore = game.team2.points;

        game.round = makeFakeRound(69, true, 60, false);
        const result = game.score();
        verifyResults(result, OffenseScore.medium, false, 0, OffenseScore.medium);
        expect(game.team1.points).to.equal(t1PointsBefore);
        expect(game.team2.points).to.equal(t2PointsBefore + OffenseScore.medium);
      });

      it('should score a bad guess properly', () => {
        game.roundCounter = 42;
        game.team1.points = 0;
        game.team2.points = 5;
        const t1PointsBefore = game.team1.points;
        const t2PointsBefore = game.team2.points;

        game.round = makeFakeRound(100, false, 1, true);
        const result = game.score();
        verifyResults(result, OffenseScore.miss, true, OffenseScore.miss, 1);
        expect(game.team1.points).to.equal(t1PointsBefore + OffenseScore.miss);
        expect(game.team2.points).to.equal(t2PointsBefore + 1);
      });
    });
  });
});