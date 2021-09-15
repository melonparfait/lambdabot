import { expect } from 'chai';
import * as NewGameCommand from '../src/commands/newgame.new.command';
import { CommandArgType, MockInteraction } from '../src/utils/testing-helpers';
import * as chai from 'chai';
import * as sinon from 'sinon';
import { GameManager } from '../src/game-manager';
import { ClueManager } from '../src/clue-manager';
import { Game } from '../src/models/game';
import { CommandInteraction, Message, TextBasedChannel, TextBasedChannels } from 'discord.js';
import { anyString, anything, instance, mock, verify, when } from 'ts-mockito';
import { gameAlreadyExists, gameInfo, newGameStarted } from '../src/helpers/print.gameinfo';
import { DEFAULT_SETTINGS, GameSettings } from '../src/models/game.settings';

const TEST_USER_ID = '54321';
const TEST_CHANNEL_ID = '12345';

describe('newgame command', () => {
  chai.use(require('sinon-chai'));
  let mockInteraction: MockInteraction;
  let command: any;
  let gameManager: GameManager;
  let clueManager: ClueManager;

  beforeEach(() => {
    command = NewGameCommand;
    gameManager = new GameManager();
    clueManager = new ClueManager();
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
      gameManager.addGame(TEST_CHANNEL_ID, new Game(TEST_CHANNEL_ID, [], gameSettings, 'oldGame'));
    });

    context('if the game is in the setup status', () => {
      beforeEach(async () => {
        mockInteraction.reply.resetHistory();
        gameManager.getGame(TEST_CHANNEL_ID).status = 'setup';
        await command.execute(mockInteraction.interactionInstance, gameManager, clueManager);
      });

      it('should tell the user that the game is already running', () => {
        expect(mockInteraction.reply).to.have.been.calledOnceWith(gameAlreadyExists);
      });
    });

    context('if the game is in the playing status', () => {
      beforeEach(async () => {
        mockInteraction.reply.resetHistory();
        gameManager.getGame(TEST_CHANNEL_ID).status = 'playing';
        await command.execute(mockInteraction.interactionInstance, gameManager, clueManager);
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
        mockInteraction.channelSend.resetHistory();
        mockInteraction.messagePin.resetHistory();
        gameManager.getGame(TEST_CHANNEL_ID).status = 'finished';
        oldGame = gameManager.getGame(TEST_CHANNEL_ID);
        await command.execute(mockInteraction.interactionInstance, gameManager, clueManager);
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

      it('should send a game info message to the channel', () => {
        expect(mockInteraction.channelSend).to.have.been.calledOnceWith(gameInfo(newGame));
      });

      it('should pinned the sent message', () => {
        expect(mockInteraction.messagePin).to.have.been.calledOnce;
      });

      it('should have notified the channel that a game started', () => {
        expect(mockInteraction.reply).to.have.been.calledOnceWith(newGameStarted(TEST_USER_ID));
      });
    });

  });

  describe('when no games exist in the current channel', () => {
    let newGame: Game;

    beforeEach(async () => {
      gameManager.resetCollection();
      await command.execute(mockInteraction.interactionInstance, gameManager, clueManager);
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

    it('should send a game info message to the channel', () => {
      expect(mockInteraction.channelSend).to.have.been.calledOnceWith(gameInfo(newGame));
    });

    it('should pinned the sent message', () => {
      expect(mockInteraction.messagePin).to.have.been.calledOnce;
    });

    it('should have notified the channel that a game started', () => {
      expect(mockInteraction.reply).to.have.been.calledOnceWith(newGameStarted(TEST_USER_ID));
    });
  });
});