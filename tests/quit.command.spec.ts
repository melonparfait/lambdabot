import { expect } from 'chai';
import { CommandArgType, MockInteraction } from '../src/utils/testing-helpers';
import * as chai from 'chai';
import * as sinon from 'sinon';
import { GameManager } from '../src/game-manager';
import { ClueManager } from '../src/clue-manager';
import * as QuitCommand from '../src/commands/quit.new.command';
import { Game } from '../src/models/game';
import { noActiveGameMessage } from '../src/helpers/print.gameinfo';

const TEST_USER_ID = '54321';
const TEST_CHANNEL_ID = '12345';

describe('quit command', () => {
  chai.use(require('sinon-chai'));
  let mockInteraction: MockInteraction;
  let command: any;
  let gameManager: GameManager;
  let clueManager: ClueManager;

  beforeEach(() => {
    command = QuitCommand;
    gameManager = new GameManager();
    clueManager = new ClueManager();
    mockInteraction = new MockInteraction(TEST_USER_ID, TEST_CHANNEL_ID);
  });

  it('should create', () => {
    expect(command).to.be.ok;
  });

  context('when there is no game in the channel', () => {
    beforeEach(async () => {
      mockInteraction.reply.resetHistory();
      await command.execute(mockInteraction.interactionInstance, gameManager);
    });

    it('should send a message that there\'s no game in the channel', () =>{
      expect(mockInteraction.reply).to.have.been.calledOnceWith(noActiveGameMessage);
    });
  });

  context('when there is a game in the channel', () => {
    let gameRef: Game;
    let endGameSpy: sinon.SinonSpy;
    beforeEach(async () => {
      gameRef = new Game(TEST_CHANNEL_ID, []);
      gameRef.pinnedInfo = mockInteraction.messageInstance;
      gameManager.addGame(TEST_CHANNEL_ID, gameRef);
      endGameSpy = sinon.spy(gameRef, 'endGame');
      mockInteraction.reply.resetHistory();
      await command.execute(mockInteraction.interactionInstance, gameManager);
    });

    it('should end the game', () => {
      expect(endGameSpy).to.have.been.calledOnce;
    });

    it('should remove the game from the gameManager', () => {
      expect(gameManager.hasGame(TEST_CHANNEL_ID)).to.be.false;
    });

    it('should unpin the game', () => {
      expect(mockInteraction.messageUnpin).to.have.been.calledOnce;
    });

    it('should send a message saying that the game was stopped', () => {
      expect(mockInteraction.reply).to.have.been.calledOnceWith(command.stoppedGameMsg);
    });
  });
});