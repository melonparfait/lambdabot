import { expect } from 'chai';
import * as NewGameCommand from '../src/commands/newgame.command';
import { MockInteraction } from '../src/utils/testing-helpers';
import * as chai from 'chai';
import { GameManager } from '../src/services/game-manager';
import { ClueManager } from '../src/services/clue-manager';
import { Game } from '../src/models/game';
import { gameAlreadyExists, getGameDetails, newGameStarted } from '../src/helpers/print.gameinfo';
import { DEFAULT_SETTINGS, GameSettings } from '../src/models/game.settings';
import { LambdabotCommand } from '../src/helpers/lambda.interface';
import * as _ from 'lodash';

const TEST_USER_ID = '54321';
const TEST_CHANNEL_ID = '12345';

describe('newgame command', () => {
  chai.use(require('sinon-chai'));
  let mockInteraction: MockInteraction;
  let command: LambdabotCommand & any;
  let gameManager: GameManager;
  let clueManager: ClueManager;

  beforeEach(() => {
    command = <LambdabotCommand><unknown>require('../src/commands/newgame.command');
    gameManager = new GameManager();
    clueManager = new ClueManager();

    command.gameManager = gameManager;
    command.clueManager = clueManager;
    mockInteraction = new MockInteraction(TEST_USER_ID, TEST_CHANNEL_ID);
  });

  it('should create', () => {
    expect(command).to.be.ok;
  });

  describe('when a game already exists in the channel', () => {
    const gameSettings: GameSettings = {
      asyncPlay: false,
      threshold: -1,
      oGuessTime: -1,
      dGuessTime: -1,
      trackStats: false
    };

    beforeEach(() => {
      gameManager.addGame(TEST_CHANNEL_ID, new Game(TEST_CHANNEL_ID, [], 'oldGame', gameSettings, ));
    });

    context('if the game is in the setup status', () => {
      beforeEach(async () => {
        mockInteraction.reply.resetHistory();
        gameManager.getGame(TEST_CHANNEL_ID).status = 'setup';
        await command.execute(mockInteraction.interactionInstance);
      });

      it('should tell the user that the game is already running', () => {
        expect(mockInteraction.reply).to.have.been.calledOnceWith(gameAlreadyExists);
      });
    });

    context('if the game is in the playing status', () => {
      beforeEach(async () => {
        mockInteraction.reply.resetHistory();
        gameManager.getGame(TEST_CHANNEL_ID).status = 'playing';
        await command.execute(mockInteraction.interactionInstance);
      });

      it('should tell the user that the game is already running', () => {
        expect(mockInteraction.reply).to.have.been.calledOnceWith(gameAlreadyExists);
      });
    });

    context('if the game is in the finished status', () => {
      let newGame: Game;
      let oldGame: Game;

      beforeEach(async () => {
        mockInteraction.reply.resetHistory();
        mockInteraction.followUp.resetHistory();
        mockInteraction.messagePin.resetHistory();
        mockInteraction.channelSend.resetHistory();
        gameManager.getGame(TEST_CHANNEL_ID).status = 'finished';
        oldGame = gameManager.getGame(TEST_CHANNEL_ID);
        await command.execute(mockInteraction.interactionInstance);
        newGame = gameManager.getGame(TEST_CHANNEL_ID);
      });

      it('should replace the old game with a new one', () => {
        expect(oldGame.id).to.not.equal(newGame.id);
      });

      it('should create the new game with the same settings as the old one', () => {
        expect(newGame.asyncPlay).to.equal(oldGame.asyncPlay);
        expect(newGame.threshold).to.equal(oldGame.threshold);
        expect(newGame.dGuessTime).to.equal(oldGame.dGuessTime);
        expect(newGame.trackStats).to.equal(oldGame.trackStats);
      });

      it('should enroll the user in the new game', () => {
        expect(newGame.players).includes(TEST_USER_ID);
      });

      it('should reply saying that the game is starting', () => {
        expect(mockInteraction.reply).to.have.been.calledOnceWith({
          content: 'Starting game...',
          ephemeral: true
        });
      });

      it('should send a game info message to the channel', () => {
        const actualWithoutTimestamp = _.omit(mockInteraction.channelSend.getCall(0).args[0].embeds[0], ['data', 'timestamp']);
        const expectedDetailsWithoutTimestamp = _.omit(getGameDetails(newGame), ['data', 'timestamp']);
        expect(actualWithoutTimestamp).to.deep.equal(expectedDetailsWithoutTimestamp);
      });

      it('should pinned the sent message', () => {
        expect(mockInteraction.messagePin).to.have.been.calledOnce;
      });

      it('should have notified the channel that a game started', () => {
        expect(mockInteraction.channelSend.getCall(1).args[0].content).to.equal(newGameStarted(TEST_USER_ID));
      });
    });

  });

  describe('when no games exist in the current channel', () => {
    let newGame: Game;

    beforeEach(async () => {
      gameManager.resetCollection();
      mockInteraction.channelSend.resetHistory();
      mockInteraction.reply.resetHistory();
      mockInteraction.messagePin.resetHistory();
      await command.execute(mockInteraction.interactionInstance);
      newGame = gameManager.getGame(TEST_CHANNEL_ID);
    });

    it('should create a game and add it to the game manager', () => {
      expect(newGame).to.exist;
    });

    it('should create the new game with default settings', () => {
      expect(newGame.asyncPlay).to.equal(DEFAULT_SETTINGS.asyncPlay);
      expect(newGame.threshold).to.equal(5);
      expect(newGame.dGuessTime).to.equal(DEFAULT_SETTINGS.dGuessTime);
      expect(newGame.trackStats).to.equal(DEFAULT_SETTINGS.trackStats);
    });

    it('should enroll the user in the new game', () => {
      expect(newGame.players).includes(TEST_USER_ID);
    });

    it('should reply saying that the game is starting', () => {
      expect(mockInteraction.reply).to.have.been.calledOnceWith({
        content: 'Starting game...',
        ephemeral: true
      });
    });

    it('should send a game info message to the channel', () => {
      const actualWithoutTimestamp = _.omit(mockInteraction.channelSend.getCall(0).args[0].embeds[0], ['data', 'timestamp']);
      const expectedDetailsWithoutTimestamp = _.omit(getGameDetails(newGame), ['data', 'timestamp']);
      expect(actualWithoutTimestamp).to.deep.equal(expectedDetailsWithoutTimestamp);
    });

    it('should pinned the sent message', () => {
      expect(mockInteraction.messagePin).to.have.been.calledOnce;
    });

    it('should have notified the channel that a game started', () => {
      expect(mockInteraction.channelSend.getCall(1).args[0].content).to.equal(newGameStarted(TEST_USER_ID));
    });
  });
});