import { expect } from 'chai';
import { CommandArgType, MockInteraction, MockUser, MockUserManager } from '../src/utils/testing-helpers';
import * as chai from 'chai';
import * as sinon from 'sinon';
import { GameManager } from '../src/game-manager';
import { ClueManager } from '../src/clue-manager';
import * as SkipCommand from '../src/commands/skip.new.command';
import { gameInfo, noActiveGameMessage, setupOnly, updateGameInfo, gameNotInProgress, clueGiverOnly, roundStatus } from '../src/helpers/print.gameinfo';
import { Game } from '../src/models/game';
import { Round } from '../src/models/round';

const TEST_USER_ID = '54321';
const TEST_CHANNEL_ID = '12345';

describe('skip command', () => {
  chai.use(require('sinon-chai'));
  let mockInteraction: MockInteraction;
  let command: any;
  let gameManager: GameManager;
  let clueManager: ClueManager;
  let mockUserManager: MockUserManager;
  
  beforeEach(() => {
    command = SkipCommand;
    gameManager = new GameManager();
    clueManager = new ClueManager();
    clueManager.data = [...Array(100).keys()].map(index => { return {
      Lower: `lower${index}`,
      Higher: `higher${index}`
    }});
    mockUserManager = new MockUserManager([new MockUser(TEST_USER_ID)]);
    mockInteraction = new MockInteraction(TEST_USER_ID, TEST_CHANNEL_ID);
  });

  it('should create', () => {
    expect(command).to.be.ok;
  });

  context('when there is no game running', () => {
    beforeEach(async () => {
      mockInteraction.reply.resetHistory();
      await command.execute(mockInteraction.interactionInstance,
        gameManager, clueManager, mockUserManager.userManagerInstance);
    });

    it('should reply that there\'s no active game', () => {
      expect(mockInteraction.reply).to.have.been.calledOnceWith(noActiveGameMessage);
    });
  })

  context('when there is an game running but it\'s not in progress', () => {
    beforeEach(async () => {
      mockInteraction.reply.resetHistory();
      gameManager.addGame(TEST_CHANNEL_ID, new Game(TEST_CHANNEL_ID, []));
      gameManager.getGame(TEST_CHANNEL_ID).status = 'setup';
      await command.execute(mockInteraction.interactionInstance,
        gameManager, clueManager, mockUserManager.userManagerInstance);
    });

    it('should reply that the game is already running', () => {
      expect(mockInteraction.reply).to.have.been.calledOnceWith(gameNotInProgress);
    });
  });

  context('when there is an game running that is in progress', () => {
    let gameRef: Game;
    let player1: MockUser;
    let player2: MockUser;
    let player3: MockUser;
    let player4: MockUser;
    let mockPlayerList: MockUser[];
    
    beforeEach(async () => {
      gameRef = new Game(TEST_CHANNEL_ID, []);
      player1 = new MockUser('player1');
      player2 = new MockUser('player2');
      player3 = new MockUser(TEST_USER_ID);
      player4 = new MockUser('player4');
      mockPlayerList = [player1, player2, player3, player4];
      mockPlayerList.forEach(player => gameRef.players.add(player.userId));
      gameRef.team1.players.push(player1.userId, player2.userId);
      gameRef.team2.players.push(player3.userId, player4.userId);
      gameRef.playedClues = [1];
      gameRef.round = new Round(gameRef.team2, gameRef.team1);
      gameRef.round.leftClue = 'Lower1';
      gameRef.round.rightClue = 'Higher1';
      gameRef.pinnedInfo = mockInteraction.messageInstance;
      gameRef.status = 'playing';
      gameManager.addGame(TEST_CHANNEL_ID, gameRef);
    });

    context('but the user is not the clue giver', () => {
      beforeEach(async () => {
        gameRef.roundCounter = 0;
        mockInteraction.reply.resetHistory();
        await command.execute(mockInteraction.interactionInstance,
          gameManager, clueManager, mockUserManager.userManagerInstance);
      });

      it('should tell the user that they\'re not the clue giver', () => {
        expect(mockInteraction.reply).to.have.been.calledOnceWith(clueGiverOnly);
      });
    });

    context('and the user is the clue giver', () => {
      const givenClue = 'bunny';
      beforeEach(async () => {
        gameRef.roundCounter = 1;
        gameRef.round = new Round(gameRef.team2, gameRef.team1);
        gameRef.pinnedInfo = mockInteraction.messageInstance;
        mockInteraction.setInteractionInput('string', 'clue', givenClue);
        mockInteraction.editPinnedMsg.resetHistory();
      });

      context('but their team already guessed', () => {
        beforeEach(async() => {
          gameRef.round.oGuess = 50;
          mockInteraction.reply.resetHistory();
          await command.execute(mockInteraction.interactionInstance,
            gameManager, clueManager, mockUserManager.userManagerInstance);
        });

        it('should tell the user that they cannot skip after a guess has been made', () => {
          expect(mockInteraction.reply).to.have.been.calledOnceWith(command.noSkipAfterGuess);
        });
      });

      context('and their team hasn\'t guessed yet', () => {
        let newRoundValueSpy: sinon.SinonSpy;
        beforeEach(async() => {
          newRoundValueSpy = sinon.spy(gameRef.round, 'generateNewValue');
          mockInteraction.reply.resetHistory();
          gameRef.pinnedInfo = mockInteraction.messageInstance;
          mockInteraction.editPinnedMsg.resetHistory();
          await command.execute(mockInteraction.interactionInstance,
            gameManager, clueManager, mockUserManager.userManagerInstance);
        });

        it('should generate a new value for the round', () => {
          expect(newRoundValueSpy).to.have.been.calledOnce;
        });

        it('should edit the pinned message with the game info', () => {
          expect(mockInteraction.editPinnedMsg).to.have.been
            .calledOnceWith(gameInfo(gameRef));
        });

        it('should reply with the game\'s round status', () => {
          expect(mockInteraction.reply).to.have.been
            .calledOnceWith(roundStatus(gameRef));
        });
      });
    });
  });
});