import { expect } from 'chai';
import { MockInteraction } from '../src/utils/testing-helpers';
import * as chai from 'chai';
import * as sinon from 'sinon';
import { GameManager } from '../src/services/game-manager';
import * as MakeTeamsCommand from '../src/commands/maketeams.command';
import { Game } from '../src/models/game';
import { assignmentResponses, gameAlreadyExists, getGameDetails, noActiveGameMessage } from '../src/helpers/print.gameinfo';
import { LambdabotCommand } from '../src/helpers/lambda.interface';
import * as _ from 'lodash';

const TEST_USER_ID = '54321';
const TEST_CHANNEL_ID = '12345';

describe('maketeams command', () => {
  chai.use(require('sinon-chai'));
  let mockInteraction: MockInteraction;
  let command: LambdabotCommand & any;
  let gameManager: GameManager;
  let gameRef: Game;
  let assignRandomTeamsSpy: sinon.SinonSpy;
  let resetTeamsSpy: sinon.SinonSpy;

  function configureUserInput(mockInteraction: MockInteraction, mode: string, reset: 'reset' | 'no_reset') {
    mockInteraction.setInteractionInput('string', 'assignmentmode', mode);
    mockInteraction.setInteractionInput('string', 'reset', reset);
  }

  beforeEach(() => {
    command = <LambdabotCommand><unknown>require('../src/commands/maketeams.command');
    gameManager = new GameManager();
    command.gameManager = gameManager;

    mockInteraction = new MockInteraction(TEST_USER_ID, TEST_CHANNEL_ID);
  });

  it('should create', () => {
    expect(command).to.be.ok;
  });

  context('if there is no game in the channel', () => {
    beforeEach(async () => {
      configureUserInput(mockInteraction, 'random', 'reset');
      mockInteraction.reply.resetHistory();
      await command.execute(mockInteraction.interactionInstance);
    });

    it('should notify the user that there\'s no game running', () => {
      expect(mockInteraction.reply).to.have.been.calledOnceWith(noActiveGameMessage);
    });
  });

  context('if there is a game in the channel, but it\'s finished', () => {
    beforeEach(async () => {
      gameRef = new Game(TEST_CHANNEL_ID, []);
      gameRef.status = 'finished';
      gameManager.addGame(TEST_CHANNEL_ID, gameRef);
      configureUserInput(mockInteraction, 'random', 'reset');
      mockInteraction.reply.resetHistory();
      await command.execute(mockInteraction.interactionInstance);
    });

    it('should notify the user that there\'s no game running', () => {
      expect(mockInteraction.reply).to.have.been.calledOnceWith(noActiveGameMessage);
    });
  });

  context('if there is a game in the channel, but it\'s in progress', () => {
    beforeEach(async () => {
      gameRef = new Game(TEST_CHANNEL_ID, []);
      gameRef.status = 'playing';
      gameManager.addGame(TEST_CHANNEL_ID, gameRef);
      configureUserInput(mockInteraction, 'random', 'reset');
      mockInteraction.reply.resetHistory();
      await command.execute(mockInteraction.interactionInstance);
    });

    it('should notify the user that a game is already in progress', () => {
      expect(mockInteraction.reply).to.have.been.calledOnceWith(gameAlreadyExists);
    });
  });

  context('if there is a game in the channel and it\'s in setup', () => {
    beforeEach(() => {
      gameRef = new Game(TEST_CHANNEL_ID, []);
      gameRef.status = 'setup';
      gameRef.pinnedInfo = mockInteraction.messageInstance;
      gameManager.addGame(TEST_CHANNEL_ID, gameRef);
    });

    context('if the user asked to do random teams without reset', () => {
      beforeEach(async () => {
        assignRandomTeamsSpy = sinon.spy(gameRef, 'assignRandomTeams');
        resetTeamsSpy = sinon.spy(gameRef, 'resetTeams');
        configureUserInput(mockInteraction, 'random', 'no_reset');
        mockInteraction.editPinnedMsg.resetHistory();
        mockInteraction.reply.resetHistory();
        await command.execute(mockInteraction.interactionInstance);
      });

      it('should not reset teams', () => {
        expect(resetTeamsSpy).to.not.have.been.called;
      });

      it('should have assigned teams randomly', () => {
        expect(assignRandomTeamsSpy).to.have.been.calledOnce;
      });

      it('should update the pinned game info', () => {
        expect(mockInteraction.editPinnedMsg).to.have.been.calledOnce;
        const actualWithoutTimestamp = _.omit(mockInteraction.editPinnedMsg.lastCall.args[0].embeds[0], ['data', 'timestamp']);
        const expectedDetailsWithoutTimestamp = _.omit(getGameDetails(gameRef), ['data', 'timestamp']);
        expect(actualWithoutTimestamp).to.deep.equal(expectedDetailsWithoutTimestamp);
      });

      it('should send a message with the new settings', () => {
        expect(mockInteraction.reply).to.have.been.calledOnceWith(assignmentResponses.random);
      });
    });

    context('if the user asked to do random teams with reset', () => {
      beforeEach(async () => {
        assignRandomTeamsSpy = sinon.spy(gameRef, 'assignRandomTeams');
        resetTeamsSpy = sinon.spy(gameRef, 'resetTeams');
        configureUserInput(mockInteraction, 'random', 'reset');
        mockInteraction.editPinnedMsg.resetHistory();
        mockInteraction.reply.resetHistory();
        await command.execute(mockInteraction.interactionInstance);
      });

      it('should have reset teams', () => {
        expect(resetTeamsSpy).to.have.been.calledOnce;
      });

      it('should have assigned teams randomly', () => {
        expect(assignRandomTeamsSpy).to.have.been.calledOnce;
      });

      it('should update the pinned game info', () => {
        expect(mockInteraction.editPinnedMsg).to.have.been.calledOnce;
        const actualWithoutTimestamp = _.omit(mockInteraction.editPinnedMsg.lastCall.args[0].embeds[0], ['data', 'timestamp']);
        const expectedDetailsWithoutTimestamp = _.omit(getGameDetails(gameRef), ['data', 'timestamp']);
        expect(actualWithoutTimestamp).to.deep.equal(expectedDetailsWithoutTimestamp);
      });

      it('should send a message with the new settings', () => {
        expect(mockInteraction.reply).to.have.been.calledOnceWith(assignmentResponses.random);
      });
    });

    context('if the user provided an invalid argument', () => {
      const invalidArg = 'foobar'
      beforeEach(async () => {
        configureUserInput(mockInteraction, invalidArg, 'reset');
        mockInteraction.reply.resetHistory();
        await command.execute(mockInteraction.interactionInstance);
      });

      it('should inform that the user provided an invalid argument', () => {
        expect(mockInteraction.reply).to.have.been.calledOnceWith(command.invalidArgument(invalidArg));
      });
    });

  });
});