import { expect } from 'chai';
import { CommandArgType, MockInteraction, MockUser, MockUserManager } from '../src/utils/testing-helpers';
import * as chai from 'chai';
import * as sinon from 'sinon';
import { GameManager } from '../src/services/game-manager';
import { ClueManager } from '../src/services/clue-manager';
import { noActiveGameMessage, gameAlreadyExists, roundStatus } from '../src/helpers/print.gameinfo';
import { Game } from '../src/models/game';
import * as  StartGameCommand from '../src/commands/startgame.command';
import { LambdabotCommand } from '../src/helpers/lambda.interface';

const TEST_USER_ID = '54321';
const TEST_CHANNEL_ID = '12345';

describe('startgame command', () => {
  chai.use(require('sinon-chai'));
  let mockInteraction: MockInteraction;
  let command: LambdabotCommand & any;
  let gameManager: GameManager;
  let clueManager: ClueManager;
  let mockUserManager: MockUserManager;

  beforeEach(() => {
    command = <LambdabotCommand><unknown>StartGameCommand;
    gameManager = new GameManager();
    clueManager = new ClueManager();
    clueManager.data = [...Array(100).keys()].map(index => { return {
      Lower: `lower${index}`,
      Higher: `higher${index}`
    }});
    mockUserManager = new MockUserManager([new MockUser(TEST_USER_ID)]);
    mockInteraction = new MockInteraction(TEST_USER_ID, TEST_CHANNEL_ID);

    command.gameManager = gameManager;
    command.clueManager = clueManager;
    command.lambdaClient = {
      users: mockUserManager.userManagerInstance
    };
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

  context('when there is an game running but it\'s in progress', () => {
    beforeEach(async () => {
      mockInteraction.reply.resetHistory();
      gameManager.addGame(TEST_CHANNEL_ID, new Game(TEST_CHANNEL_ID, []));
      gameManager.getGame(TEST_CHANNEL_ID).status = 'playing';
      await command.execute(mockInteraction.interactionInstance);
    });

    it('should reply that the game is already running', () => {
      expect(mockInteraction.reply).to.have.been.calledOnceWith(gameAlreadyExists);
    });
  });

  context('when there is an active game in setup', () => {
    let gameRef: Game;
    let gameStartSpy: sinon.SinonSpy;
    let player1: MockUser;
    let player2: MockUser;
    let player3: MockUser;
    let player4: MockUser;
    let player5: MockUser;

    beforeEach(() => {
      gameRef = new Game(TEST_CHANNEL_ID, clueManager.data);
      gameRef.status = 'setup';
      gameStartSpy = sinon.spy(gameRef, 'start');
      player1 = new MockUser('player1');
      player2 = new MockUser('player2');
      player3 = new MockUser('player3');
      player4 = new MockUser('player4');
      player5 = new MockUser('player5');
    });

    context('if there are not enough players on team 1', () => {
      beforeEach(async () => {
        gameRef.players.add(player1.userId);
        gameRef.players.add(player2.userId);
        gameRef.players.add(player3.userId);
        gameRef.players.add(player4.userId);
        gameRef.team1.players.push(player1.userId);
        gameRef.team2.players.push(player2.userId,
          player3.userId, player4.userId);
        gameManager.addGame(TEST_CHANNEL_ID, gameRef);
        gameStartSpy.resetHistory();
        mockInteraction.reply.resetHistory();
        await command.execute(mockInteraction.interactionInstance)
      });

      it('should not start the game', () => {
        expect(gameStartSpy).to.not.have.been.called;;
      });

      it('should state that there aren\'t enough players on team 1', () => {
        expect(mockInteraction.reply).to.have.been
          .calledOnceWith(command.insufficientPlayersMessage(1, 0));
        expect(mockInteraction.reply.lastCall.args[0]).to.include('Team 1 needs 1 more player(s).');
      });
    });

    context('if there are not enough players on team 2', () => {
      beforeEach(async () => {
        gameRef.players.add(player1.userId);
        gameRef.players.add(player2.userId);
        gameRef.players.add(player3.userId);
        gameRef.players.add(player4.userId);
        gameRef.team1.players.push(player1.userId, player2.userId, player3.userId);
        gameRef.team2.players.push(player4.userId);
        gameManager.addGame(TEST_CHANNEL_ID, gameRef);
        gameStartSpy.resetHistory();
        mockInteraction.reply.resetHistory();
        await command.execute(mockInteraction.interactionInstance)
      });

      it('should not start the game', () => {
        expect(gameStartSpy).to.not.have.been.called;
      });

      it('should state that there aren\'t enough players on team 2', () => {
        expect(mockInteraction.reply).to.have.been
          .calledOnceWith(command.insufficientPlayersMessage(0, 1));
        expect(mockInteraction.reply.lastCall.args[0]).to.include('Team 2 needs 1 more player(s).');
      });
    });

    context('if there are not enough players on both teams', () => {
      beforeEach(async () => {
        gameRef.players.add(player1.userId);
        gameRef.players.add(player2.userId);
        gameRef.team1.players.push(player1.userId);
        gameRef.team2.players.push(player2.userId);
        gameManager.addGame(TEST_CHANNEL_ID, gameRef);
        gameStartSpy.resetHistory();
        mockInteraction.reply.resetHistory();
        await command.execute(mockInteraction.interactionInstance)
      });

      it('should not start the game', () => {
        expect(gameStartSpy).to.not.have.been.called;
      });

      it('should state that there aren\'t enough players on both teams', () => {
        expect(mockInteraction.reply).to.have.been
          .calledOnceWith(command.insufficientPlayersMessage(1, 1));
        expect(mockInteraction.reply.lastCall.args[0]).to.include('Team 1 needs 1 more player(s).');
        expect(mockInteraction.reply.lastCall.args[0]).to.include('Team 2 needs 1 more player(s).');
      });
    });

    context('if there are enough players on both teams', () => {
      let mockPlayerList: MockUser[];

      beforeEach(async () => {
        mockPlayerList = [player1, player2, player3, player4];
        mockUserManager.addUserToCache(mockPlayerList);
        mockPlayerList.forEach(player => {
          gameRef.players.add(player.userId);
          player.resetCalls();
        });
        gameRef.team1.players.push(player1.userId, player2.userId);
        gameRef.team2.players.push(player3.userId, player4.userId);
        gameRef.pinnedInfo = mockInteraction.messageInstance;
        gameManager.addGame(TEST_CHANNEL_ID, gameRef);
        gameStartSpy.resetHistory();
        mockInteraction.reply.resetHistory();
        await command.execute(mockInteraction.interactionInstance)
      });

      it('should start the game', () => {
        expect(gameStartSpy).to.have.been.calledOnce;
      });

      it('should add a played clue to the game\'s list of played clues', () => {
        expect(gameRef.playedClues.length).to.equal(1);
      });

      it('should set the currentClue to undefined', () => {
        expect(gameRef.currentClue).to.be.undefined;
      });

      it('should set the round\'s clues properly', () => {
        const leftClue = clueManager.data[gameRef.playedClues[0]].Lower;
        const rightClue = clueManager.data[gameRef.playedClues[0]].Higher;
        expect(gameRef.round.leftClue).to.equal(leftClue);
        expect(gameRef.round.rightClue).to.equal(rightClue);
      });

      it('should message the user info about the round', () => {
        const clueGiver = mockUserManager.mockUserCache.get(gameRef.round.clueGiver);
        expect(clueGiver?.send).to.have.been.calledOnce;
      });

      it('should message the channel information about the round', () => {
        expect(mockInteraction.reply).to.have.been.calledOnceWith(roundStatus(gameRef));
      });
    });
  });
});