import { expect } from 'chai';
import { MockInteraction } from '../src/utils/testing-helpers';
import * as chai from 'chai';
import * as sinon from 'sinon';
import { GameManager } from '../src/services/game-manager';
import { ClueManager } from '../src/services/clue-manager';
import * as ConfigCommand from '../src/commands/config.command';
import { gameInfo, noActiveGameMessage, setupOnly, updateGameInfo } from '../src/helpers/print.gameinfo';
import { Game } from '../src/models/game';
import { LambdabotCommand } from '../src/helpers/lambda.interface';

const TEST_USER_ID = '54321';
const TEST_CHANNEL_ID = '12345';

describe('config command', () => {
  chai.use(require('sinon-chai'));
  let mockInteraction: MockInteraction;
  let command: LambdabotCommand & any;
  let gameManager: GameManager;
  let clueManager: ClueManager;

  function configureUserInput(mockInteraction: MockInteraction, asyncConfig: 'on' | 'off',
      trackStatsConfig: 'on' | 'off', thresholdConfig: number, defenseTimerConfig: number) {
    mockInteraction.setInteractionInput('string', 'timers', asyncConfig);
    mockInteraction.setInteractionInput('string', 'trackstats', trackStatsConfig);
    mockInteraction.setInteractionInput('integer', 'threshold', thresholdConfig);
    mockInteraction.setInteractionInput('integer', 'defensetimer', defenseTimerConfig);
  }

  beforeEach(() => {
    command = <LambdabotCommand><unknown>ConfigCommand;
    gameManager = new GameManager();
    clueManager = new ClueManager();
    command.gameManager = gameManager;
    command.clueManager = clueManager;

    mockInteraction = new MockInteraction(TEST_USER_ID, TEST_CHANNEL_ID);
  });

  it('should create', () => {
    expect(command).to.be.ok;
  });

  describe('when there is no game running', () => {
    beforeEach(async () => {
      mockInteraction.reply.resetHistory();
      await command.execute(mockInteraction.interactionInstance);
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
      await command.execute(mockInteraction.interactionInstance);
    });

    it('should reply the command is only available during setup', () => {
      expect(mockInteraction.reply).to.have.been.calledOnceWith(setupOnly);
    });
  });

  describe('when there is a game in the setup phase', () => {
    function testValidArguments(async: 'on' | 'off', trackStats: 'on' | 'off',
        threshold: number, defenseTimer: number) {
      let gameRef: Game;
      let setSettingsSpy: sinon.SinonSpy;
  
      beforeEach(async () => {
        gameRef = new Game(TEST_CHANNEL_ID, []);
        gameRef.status = 'setup';

        gameRef.join(TEST_USER_ID);
        gameManager.addGame(TEST_CHANNEL_ID, gameRef);
        setSettingsSpy = sinon.spy(gameRef, 'setSettings');

        mockInteraction = new MockInteraction(TEST_USER_ID, TEST_CHANNEL_ID);
        configureUserInput(mockInteraction, async, trackStats, threshold, defenseTimer);

        gameRef.pinnedInfo = mockInteraction.messageInstance;

        mockInteraction.reply.resetHistory();
        mockInteraction.editPinnedMsg.resetHistory();

        await command.execute(mockInteraction.interactionInstance);
      });
  
      it('should set the game config properly', () => {
        expect(setSettingsSpy).to.have.been.calledOnceWithExactly({
          asyncPlay: async === 'off',
          threshold: threshold,
          oGuessTime: 0,
          dGuessTime: defenseTimer * 1000,
          trackStats: trackStats === 'on'
        });
      });

      it('should update the pinned game info', () => {
        expect(mockInteraction.editPinnedMsg).to.have.been.calledOnceWith(gameInfo(gameRef));
      });

      it('should send a message with the new settings', () => {
        expect(mockInteraction.reply).to.have.been.calledOnceWith(
          command.sendUpdatedSettings(TEST_CHANNEL_ID, gameManager));
      });
    }

    describe('when a user inputs valid arguments (1)', () => testValidArguments('off', 'on', 10, 10));
    describe('when a user inputs valid arguments (2)', () => testValidArguments('on', 'off', 25, 398));
    describe('when a user inputs valid arguments (3)', () => testValidArguments('off', 'off', 2957, 19999));
    describe('when a user inputs valid arguments (4)', () => testValidArguments('on', 'on', 5, 2147483646));

    describe('when a user inputs an invalid minimum threshold error', () => {
      const asyncConfig = 'on';
      const trackStatsConfig = 'off';
      const thresholdConfig = 4;
      const defenseTimerConfig = 10;
      let gameRef: Game;
  
      beforeEach(async () => {
        gameManager.addGame(TEST_CHANNEL_ID, new Game(TEST_CHANNEL_ID, []));
        gameRef = gameManager.getGame(TEST_CHANNEL_ID)
        gameRef.status = 'setup';
        mockInteraction = new MockInteraction(TEST_USER_ID, TEST_CHANNEL_ID);
        configureUserInput(mockInteraction, asyncConfig, trackStatsConfig, thresholdConfig, defenseTimerConfig);
        mockInteraction.reply.resetHistory();

        await command.execute(mockInteraction.interactionInstance);
      });
  
      it('should reply with an minimum threshold error', () => {
        expect(mockInteraction.reply).to.have.been.calledOnceWithExactly(command.minimumThresholdError(thresholdConfig));
      });
    });

    describe('when a user inputs an invalid minimum defense timer error', () => {
      const asyncConfig = 'on';
      const trackStatsConfig = 'off';
      const thresholdConfig = 10;
      const defenseTimerConfig = -4;
      let gameRef: Game;
  
      beforeEach(async () => {
        gameManager.addGame(TEST_CHANNEL_ID, new Game(TEST_CHANNEL_ID, []));
        gameRef = gameManager.getGame(TEST_CHANNEL_ID)
        gameRef.status = 'setup';
        mockInteraction = new MockInteraction(TEST_USER_ID, TEST_CHANNEL_ID);
        configureUserInput(mockInteraction, asyncConfig, trackStatsConfig, thresholdConfig, defenseTimerConfig);
        mockInteraction.reply.resetHistory();

        await command.execute(mockInteraction.interactionInstance, gameManager);
      });
  
      it('should reply with an minimum defense timer error', () => {
        expect(mockInteraction.reply).to.have.been.calledOnceWithExactly(command.minimumDefenseTimerError(defenseTimerConfig));
      });
    });

    describe('when a user inputs an invalid maximum threshold timer error', () => {
      const asyncConfig = 'on';
      const trackStatsConfig = 'off';
      const thresholdConfig = 2147483648;
      const defenseTimerConfig = 5;
      let gameRef: Game;
  
      beforeEach(async () => {
        gameManager.addGame(TEST_CHANNEL_ID, new Game(TEST_CHANNEL_ID, []));
        gameRef = gameManager.getGame(TEST_CHANNEL_ID)
        gameRef.status = 'setup';
        mockInteraction = new MockInteraction(TEST_USER_ID, TEST_CHANNEL_ID);
        configureUserInput(mockInteraction, asyncConfig, trackStatsConfig, thresholdConfig, defenseTimerConfig);
        mockInteraction.reply.resetHistory();

        await command.execute(mockInteraction.interactionInstance);
      });
  
      it('should reply with an maximum threshold timer error', () => {
        expect(mockInteraction.reply).to.have.been.calledOnceWithExactly(command.maximumThresholdError(thresholdConfig));
      });
    });
  });
});