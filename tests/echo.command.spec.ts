import { expect } from 'chai';
import * as EchoCommand from '../src/commands/echo.new.command';
import { CommandArgType, MockInteraction } from '../src/utils/testing-helpers';
import * as chai from 'chai';
import { SinonStub } from 'sinon';
import { GameManager } from '../src/game-manager';
import { ClueManager } from '../src/clue-manager';

const TEST_USER_ID = '54321';
const TEST_CHANNEL_ID = '12345';

describe('echo command', () => {
  chai.use(require('sinon-chai'));
  let mockInteraction: MockInteraction;
  let command: any;
  let gameManager: GameManager;
  let clueManager: ClueManager;

  beforeEach(() => {
    command = EchoCommand;
    gameManager = new GameManager();
    clueManager = new ClueManager();
    mockInteraction = new MockInteraction(TEST_USER_ID, TEST_CHANNEL_ID);
  });

  it('should create', () => {
    expect(command).to.be.ok;
  });

  describe('when a user types in input', () => {
    const inputString = 'hello world';

    beforeEach(async () => {
      mockInteraction = new MockInteraction(TEST_USER_ID, TEST_CHANNEL_ID);
      mockInteraction.setInteractionInput('string', 'input', inputString);
      mockInteraction.reply.resetHistory();
      await command.execute(mockInteraction.interactionInstance);
    });

    it('should return the interaction\'s content', () => {
      expect(mockInteraction.reply).to.have.been.calledOnceWith(inputString);
    });
  });
});