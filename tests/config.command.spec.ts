import { expect } from 'chai';
import { CommandArgType, MockInteraction } from '../src/utils/testing-helpers';
import * as chai from 'chai';
import * as sinon from 'sinon';
import { GameManager } from '../src/game-manager';
import { ClueManager } from '../src/clue-manager';
import * as ConfigCommand from '../src/commands/config.new.command';
import { minimumThresholdError, noActiveGameMessage, setupOnly } from '../src/helpers/print.gameinfo';
import { Game } from '../src/models/game';

const TEST_USER_ID = '54321';
const TEST_CHANNEL_ID = '12345';

describe('config command', () => {
  chai.use(require('sinon-chai'));
  let mockInteraction: MockInteraction;
  let command: any;
  let gameManager: GameManager;
  let clueManager: ClueManager;

  beforeEach(() => {
    command = ConfigCommand;
    gameManager = new GameManager();
    clueManager = new ClueManager();
    mockInteraction = new MockInteraction(TEST_USER_ID, TEST_CHANNEL_ID);
  });

  it('should create', () => {
    expect(command).to.be.ok;
  });

  describe('when there is no game running', () => {
    beforeEach(async () => {
      mockInteraction.reply.resetHistory();
      await command.execute(mockInteraction.interactionInstance, gameManager);
    });

    it('should reply that there\'s no active game', () => {
      expect(mockInteraction.reply).to.have.been.calledOnceWith(noActiveGameMessage);
    });
  })

  describe('when there is an game running but it\'s not in the setup phase', () => {
    beforeEach(async () => {
      mockInteraction.reply.resetHistory();
      gameManager.addGame(TEST_CHANNEL_ID, new Game(TEST_CHANNEL_ID, []));
      gameManager.getGame(TEST_CHANNEL_ID).status = 'playing';
      await command.execute(mockInteraction.interactionInstance, gameManager);
    });

    it('should reply the command is only available during setup', () => {
      expect(mockInteraction.reply).to.have.been.calledOnceWith(setupOnly);
    });
  });

  describe('when there is a game in the setup phase', () => {
    function testValidArguments(async: boolean, trackStats: boolean,
        threshold: number, defenseTimer: number) {
      let gameRef: Game;
      let setSettingsSpy: sinon.SinonSpy;
  
      beforeEach(async () => {
        gameManager.addGame(TEST_CHANNEL_ID, new Game(TEST_CHANNEL_ID, []));
        gameRef = gameManager.getGame(TEST_CHANNEL_ID)
        gameRef.status = 'setup';
        mockInteraction = new MockInteraction(TEST_USER_ID, TEST_CHANNEL_ID);
        mockInteraction.setInteractionInput('boolean', 'async', async);
        mockInteraction.setInteractionInput('boolean', 'trackstats', trackStats);
        mockInteraction.setInteractionInput('integer', 'threshold', threshold);
        mockInteraction.setInteractionInput('integer', 'defensetimer', defenseTimer);
        mockInteraction.reply.resetHistory();

        setSettingsSpy = sinon.spy(gameRef, 'setSettings');

        await command.execute(mockInteraction.interactionInstance, gameManager);
      });
  
      it('should set the game config properly', () => {
        expect(setSettingsSpy).to.have.been.calledOnceWithExactly({
          asyncPlay: async,
          threshold: threshold,
          oGuessTime: 0,
          dGuessTime: defenseTimer * 1000,
          trackStats: trackStats
        });
      });

      it('should update the pinned game info', () => {

      });

      it('should send a message with the new settings', () => {

      });
    }

    describe('when a user inputs valid arguments (1)', () => testValidArguments(true, true, 10, 10));
    describe('when a user inputs valid arguments (2)', () => testValidArguments(false, false, 25, 398));
    describe('when a user inputs valid arguments (3)', () => testValidArguments(true, false, 2957, 19999));
    describe('when a user inputs valid arguments (4)', () => testValidArguments(false, true, 5, 2147483646));

    describe('when a user inputs an invalid minimum threshold error', () => {
      const asyncConfig = false;
      const trackStatsConfig = false;
      const thresholdConfig = 4;
      const defenseTimerConfig = 10;
      let gameRef: Game;
  
      beforeEach(async () => {
        gameManager.addGame(TEST_CHANNEL_ID, new Game(TEST_CHANNEL_ID, []));
        gameRef = gameManager.getGame(TEST_CHANNEL_ID)
        gameRef.status = 'setup';
        mockInteraction = new MockInteraction(TEST_USER_ID, TEST_CHANNEL_ID);
        mockInteraction.setInteractionInput('boolean', 'async', asyncConfig);
        mockInteraction.setInteractionInput('boolean', 'trackstats', trackStatsConfig);
        mockInteraction.setInteractionInput('integer', 'threshold', thresholdConfig);
        mockInteraction.setInteractionInput('integer', 'defensetimer', defenseTimerConfig);
        mockInteraction.reply.resetHistory();

        await command.execute(mockInteraction.interactionInstance, gameManager);
      });
  
      it('should reply with an minimum threshold error', () => {
        expect(mockInteraction.reply).to.have.been.calledOnceWithExactly(minimumThresholdError(thresholdConfig));
      });
    });
  });
});