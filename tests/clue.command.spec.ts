import { expect } from 'chai';
import { CommandArgType, MockInteraction, MockUser } from '../src/utils/testing-helpers';
import * as chai from 'chai';
import * as sinon from 'sinon';
import { GameManager } from '../src/services/game-manager';
import { ClueManager } from '../src/services/clue-manager';
import * as ClueCommand from '../src/commands/clue.command';
import { gameInfo, noActiveGameMessage, gameNotInProgress, clueGiverOnly } from '../src/helpers/print.gameinfo';
import { Game } from '../src/models/game';
import { Round } from '../src/models/round';
import { LambdabotCommand } from '../src/helpers/lambda.interface';

const TEST_USER_ID = '54321';
const TEST_CHANNEL_ID = '12345';

describe('clue command', () => {
  chai.use(require('sinon-chai'));
  let mockInteraction: MockInteraction;
  let command: LambdabotCommand & any;
  let gameManager: GameManager;
  let clueManager: ClueManager;

  beforeEach(() => {
    command = <LambdabotCommand><unknown>ClueCommand;
    gameManager = new GameManager();
    clueManager = new ClueManager();
    command.gameManager = gameManager;
    command.clueManager = clueManager;

    mockInteraction = new MockInteraction(TEST_USER_ID, TEST_CHANNEL_ID);
  });

  it('should create', () => {
    expect(command).to.be.ok;
  });

  context('when there is no game running', () => {
    beforeEach(async () => {
      mockInteraction.reply.resetHistory();
      await command.execute(mockInteraction.interactionInstance);
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
      await command.execute(mockInteraction.interactionInstance);
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

      gameRef.pinnedInfo = mockInteraction.messageInstance;
      gameRef.status = 'playing';
      gameManager.addGame(TEST_CHANNEL_ID, gameRef);
    });

    context('but the user is not the clue giver', () => {
      beforeEach(async () => {
        gameRef.roundCounter = 0;
        mockInteraction.reply.resetHistory();
        await command.execute(mockInteraction.interactionInstance)
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
        mockInteraction.reply.resetHistory();
        mockInteraction.editPinnedMsg.resetHistory();
        await command.execute(mockInteraction.interactionInstance)
      });

      it('should set the game\'s current clue to the input string', () => {
        expect(gameRef.currentClue).to.equal(givenClue);
      });

      it('should update the pinned info', () => {
        expect(mockInteraction.editPinnedMsg).to.have.been.calledOnceWith(gameInfo(gameRef));
      });

      it('should send a message to the channel with the clue', () => {
        expect(mockInteraction.reply).to.have.been
          .calledOnceWith(command.replyMsg(TEST_USER_ID, gameRef));
      });
    });
  });
});