import { expect } from 'chai';
import { MockInteraction, MockUser, MockUserManager } from '../src/utils/testing-helpers';
import * as chai from 'chai';
import * as sinon from 'sinon';
import { GameManager } from '../src/game-manager';
import { ClueManager } from '../src/clue-manager';
import * as GuessCommand from '../src/commands/guess.new.command';
import { Game } from '../src/models/game';
import { gameInfo, gameNotInProgress, noActiveGameMessage, roundStatus } from '../src/helpers/print.gameinfo';
import { DBService } from '../src/db.service';
import { instance, mock } from 'ts-mockito';
import { OffenseScore, ScoringResults } from '../src/models/scoring.results';

const TEST_USER_ID = '54321';
const TEST_CHANNEL_ID = '12345';

describe('guess command', () => {
  chai.use(require('sinon-chai'));
  let mockInteraction: MockInteraction;
  let command: any;
  let gameManager: GameManager;
  let clueManager: ClueManager;
  let mockUserManager: MockUserManager;
  let mockDBService: DBService;
  let dbServiceInstance: DBService;

  let gameRef: Game;
  let player1: MockUser;
  let player2: MockUser;
  let player3: MockUser;
  let player4: MockUser;
  let mockPlayerList: MockUser[];
  let roundValue: number;

  beforeEach(() => {
    command = GuessCommand;
    gameManager = new GameManager();
    clueManager = new ClueManager();
    clueManager.data = [...Array(100).keys()].map(index => { return {
      Lower: `lower${index}`,
      Higher: `higher${index}`
    }});
    player1 = new MockUser(TEST_USER_ID);
    player2 = new MockUser('player2');
    player3 = new MockUser('player3');
    player4 = new MockUser('player4');
    mockUserManager = new MockUserManager([new MockUser(TEST_USER_ID)]);
    mockUserManager.addUserToCache([player1, player2, player3, player4]);
    mockInteraction = new MockInteraction(TEST_USER_ID, TEST_CHANNEL_ID);
    mockDBService = mock(DBService);
    dbServiceInstance = instance(mockDBService);
  });

  it('should create', () => {
    expect(command).to.be.ok;
  });

  context('when there is no game running', () => {
    beforeEach(async () => {
      mockInteraction.reply.resetHistory();
      await command.execute(mockInteraction.interactionInstance, gameManager,
        clueManager, mockUserManager.userManagerInstance, dbServiceInstance);
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
      await command.execute(mockInteraction.interactionInstance, gameManager,
        clueManager, mockUserManager.userManagerInstance, dbServiceInstance);
    });

    it('should reply that the game is already running', () => {
      expect(mockInteraction.reply).to.have.been.calledOnceWith(gameNotInProgress);
    });
  });

  context('guess clue subcommand', () => {
    beforeEach(async () => {
      mockInteraction.setSubcommandInput('clue')
      gameRef = new Game(TEST_CHANNEL_ID, []);
      mockPlayerList = [player1, player2, player3, player4];
      mockPlayerList.forEach(player => gameRef.players.add(player.userId));;
      gameRef.pinnedInfo = mockInteraction.messageInstance;
      gameRef.start();

      gameRef.round.value = 50;
      roundValue = gameRef.round.value;
      gameManager.addGame(TEST_CHANNEL_ID, gameRef);
    });

    context('if the user is the clue giver', () => {
      beforeEach(async () => {
        gameRef.round.clueGiver = TEST_USER_ID;
        gameRef.team1.players.push(player1.userId, player2.userId);
        gameRef.team2.players.push(player3.userId, player4.userId)
        mockInteraction.setInteractionInput('integer', 'number', 50);
        mockInteraction.reply.resetHistory();
        await command.execute(mockInteraction.interactionInstance, gameManager,
          clueManager, mockUserManager.userManagerInstance, dbServiceInstance);
      });

      it('should reply that the clue giver cannot guess', () => {
        expect(mockInteraction.reply).to.have.been.calledOnceWith(command.clueGiverCannotGuess);
      });
    });

    context('if the user is on the wrong team', () => {
      beforeEach(async () => {
        gameRef.round.clueGiver = player2.userId;
        gameRef.team1.players.push(player2.userId, player3.userId);
        gameRef.team2.players.push(player1.userId, player4.userId)
        mockInteraction.setInteractionInput('integer', 'number', 50);
        mockInteraction.reply.resetHistory();
        await command.execute(mockInteraction.interactionInstance, gameManager,
          clueManager, mockUserManager.userManagerInstance, dbServiceInstance);
      });

      it('should reply that only players on the right team can guess', () => {
        expect(mockInteraction.reply).to.have.been.calledOnceWith(command.wrongTeamCannotGuess(1));
      });
    });

    context('if a guess has already been made', () => {
      beforeEach(async () => {
        gameRef.round.makeOGuess(25);
        gameRef.round.clueGiver = player2.userId;
        gameRef.team1.players.push(player1.userId, player2.userId);
        gameRef.team2.players.push(player3.userId, player4.userId)
        mockInteraction.setInteractionInput('integer', 'number', 50);
        mockInteraction.reply.resetHistory();
        await command.execute(mockInteraction.interactionInstance, gameManager,
          clueManager, mockUserManager.userManagerInstance, dbServiceInstance);
      });

      it('should reply that a guess has already been made', () => {
        expect(mockInteraction.reply).to.have.been.calledOnceWith(command.alreadyGuessed(25));
      });
    });

    context('if a clue hasn\'t been given yet', () => {
      beforeEach(async () => {
        gameRef.currentClue = undefined;
        gameRef.round.clueGiver = player2.userId;
        gameRef.team1.players.push(player1.userId, player2.userId);
        gameRef.team2.players.push(player3.userId, player4.userId)
        mockInteraction.setInteractionInput('integer', 'number', 50);
        mockInteraction.reply.resetHistory();
        await command.execute(mockInteraction.interactionInstance, gameManager,
          clueManager, mockUserManager.userManagerInstance, dbServiceInstance);
      });

      it('should reply that a clue hasn\'t been given yet', () => {
        expect(mockInteraction.reply).to.have.been.calledOnceWith(command.noClueYet);
      });
    });

    context('if the guess was an invalid integer (over 100)', () => {
      beforeEach(async () => {
        gameRef.currentClue = 'something really cool';
        gameRef.round.clueGiver = player2.userId;
        gameRef.team1.players.push(player1.userId, player2.userId);
        gameRef.team2.players.push(player3.userId, player4.userId)
        mockInteraction.setInteractionInput('integer', 'number', 101);
        mockInteraction.reply.resetHistory();
        await command.execute(mockInteraction.interactionInstance, gameManager,
          clueManager, mockUserManager.userManagerInstance, dbServiceInstance);
      });

      it('should reply that the guess has to be a valid integer', () => {
        expect(mockInteraction.reply).to.have.been.calledOnceWith(command.invalidInteger);
      });
    });

    context('if the guess was an invalid integer (under 1)', () => {
      beforeEach(async () => {
        gameRef.currentClue = 'something really cool';
        gameRef.round.clueGiver = player2.userId;
        gameRef.team1.players.push(player1.userId, player2.userId);
        gameRef.team2.players.push(player3.userId, player4.userId)
        mockInteraction.setInteractionInput('integer', 'number', 0);
        mockInteraction.reply.resetHistory();
        await command.execute(mockInteraction.interactionInstance, gameManager,
          clueManager, mockUserManager.userManagerInstance, dbServiceInstance);
      });

      it('should reply that the guess has to be a valid integer', () => {
        expect(mockInteraction.reply).to.have.been.calledOnceWith(command.invalidInteger);
      });
    });

    context('if all parameters are correct', () => {
      let oGuessSpy: sinon.SinonSpy;

      beforeEach(async () => {
        oGuessSpy = sinon.spy(gameRef.round, 'makeOGuess');
        gameRef.currentClue = 'something really cool';
        gameRef.round.clueGiver = player2.userId;
        gameRef.team1.players.push(player1.userId, player2.userId);
        gameRef.team2.players.push(player3.userId, player4.userId)
        mockInteraction.setInteractionInput('integer', 'number', 40);
        mockInteraction.reply.resetHistory();
        await command.execute(mockInteraction.interactionInstance, gameManager,
          clueManager, mockUserManager.userManagerInstance, dbServiceInstance);
      });

      it('should have set the offensive guess on the game', () => {
        expect(oGuessSpy).to.have.been.calledOnceWith(40);
      });

      it('should replied with the counter prompt', () => {
        expect(mockInteraction.reply).to.have.been.calledOnceWith(command.counterPrompt(gameRef));
      });
    });
  });

  context('guess higher subcommand', () => {
    beforeEach(async () => {
      mockInteraction.setSubcommandInput('higher')
      gameRef = new Game(TEST_CHANNEL_ID, []);
      mockPlayerList = [player1, player2, player3, player4];
      mockPlayerList.forEach(player => gameRef.players.add(player.userId));;
      gameRef.pinnedInfo = mockInteraction.messageInstance;
      gameRef.start();

      gameRef.round.value = 50;
      gameManager.addGame(TEST_CHANNEL_ID, gameRef);
    });

    context('if the user is not on the defense team', () => {
      beforeEach(async () => {
        gameRef.currentClue = 'something really cool';
        gameRef.round.clueGiver = player2.userId;
        gameRef.team1.players.push(player1.userId, player2.userId);
        gameRef.team2.players.push(player3.userId, player4.userId);
        mockInteraction.reply.resetHistory();
        await command.execute(mockInteraction.interactionInstance, gameManager,
          clueManager, mockUserManager.userManagerInstance, dbServiceInstance);
      });

      it('should reply that only players on the defense team can counter', () => {
        expect(mockInteraction.reply).to.have.been.calledOnceWith(command.wrongTeamCannotCounter(2));
      });
    });

    context('if an offensive guess has not been made yet', () => {
      beforeEach(async () => {
        gameRef.currentClue = 'something really cool';
        gameRef.round.oGuess = undefined;
        gameRef.round.clueGiver = player2.userId;
        gameRef.team1.players.push(player2.userId, player3.userId);
        gameRef.team2.players.push(player1.userId, player4.userId);
        mockInteraction.reply.resetHistory();
        await command.execute(mockInteraction.interactionInstance, gameManager,
          clueManager, mockUserManager.userManagerInstance, dbServiceInstance);
      });

      it('should reply there is\'nt a guess yet', () => {
        expect(mockInteraction.reply).to.have.been.calledOnceWith(command.noGuessYet);
      });
    });

    context('if all parameters are correct', () => {
      let scoreSpy: sinon.SinonSpy;
      beforeEach(() => {
        gameRef.currentClue = 'something really cool';
        gameRef.round.clueGiver = player2.userId;
        gameRef.team1.players.push(player2.userId, player3.userId);
        gameRef.team2.players.push(player1.userId, player4.userId);
        gameRef.round.oTeam = gameRef.team1;
        gameRef.round.dTeam = gameRef.team2;
        gameRef.pinnedInfo = mockInteraction.messageInstance;
      });

      context('if the counter guess is incorrect', () => {
        beforeEach(async () => {
          scoreSpy = sinon.spy(gameRef, 'score');
          gameRef.round.value = 50;
          gameRef.round.oGuess = 55;
          roundValue = gameRef.round.value;
          mockUserManager.mockUserCache.get(gameRef.round.clueGiver).send.resetHistory();
          mockInteraction.channelSend.resetHistory();
          mockInteraction.reply.resetHistory();
          mockInteraction.editPinnedMsg.resetHistory();
          await command.execute(mockInteraction.interactionInstance, gameManager,
            clueManager, mockUserManager.userManagerInstance, dbServiceInstance);
        });

        it('should send a message to the channel with the results', () => {
          const scoringResults: ScoringResults = scoreSpy.returnValues[0];
          const expectedMessage = command.resolveGuessMessage(scoringResults, {
            round: {
              dGuess: true,
              value: roundValue
            },
            defenseTeamNumber: () => 2,
            offenseTeamNumber: () => 1,
          });
          expect(mockInteraction.channelSend.getCall(0).args[0]).to.equal(expectedMessage);
        });

        it('should send a message to the channel with the point gains', () => {
          const scoringResults: ScoringResults = scoreSpy.returnValues[0];
          const expectedMessage = command.pointChange(scoringResults, gameRef);
          expect(mockInteraction.channelSend.getCall(1).args[0]).to.equal(expectedMessage);
        });

        it('should have scored the game', () => {
          expect(scoreSpy).to.have.been.calledOnce;
        });
    
        it('should reply to the interaction with the new round status', () => {
          expect(mockInteraction.reply).to.have.been.calledOnceWith(roundStatus(gameRef));
        });

        it('should message the user info about the round', () => {
          const clueGiver = mockUserManager.mockUserCache.get(gameRef.round.clueGiver);
          expect(clueGiver.send).to.have.been.calledOnce;
        });

        it('should update the pinned info', () => {
          expect(mockInteraction.editPinnedMsg).to.have.been.calledOnceWith(gameInfo(gameRef));
        });
      });

      context('if the counter guess is correct', () => {
        beforeEach(async () => {
          scoreSpy = sinon.spy(gameRef, 'score');
          gameRef.round.value = 50;
          gameRef.round.oGuess = 45;
          roundValue = gameRef.round.value;
          mockUserManager.mockUserCache.get(gameRef.round.clueGiver).send.resetHistory();
          mockInteraction.channelSend.resetHistory();
          mockInteraction.reply.resetHistory();
          mockInteraction.editPinnedMsg.resetHistory();
          await command.execute(mockInteraction.interactionInstance, gameManager,
            clueManager, mockUserManager.userManagerInstance, dbServiceInstance);
        });

        it('should send a message to the channel with the results', () => {
          const scoringResults: ScoringResults = scoreSpy.returnValues[0];
          const expectedMessage = command.resolveGuessMessage(scoringResults, {
            round: {
              dGuess: true,
              value: roundValue
            },
            defenseTeamNumber: () => 2,
            offenseTeamNumber: () => 1,
          });
          expect(mockInteraction.channelSend.getCall(0).args[0]).to.equal(expectedMessage);
        });

        it('should send a message to the channel with the point gains', () => {
          const scoringResults: ScoringResults = scoreSpy.returnValues[0];
          const expectedMessage = command.pointChange(scoringResults, gameRef);
          expect(mockInteraction.channelSend.getCall(1).args[0]).to.equal(expectedMessage);
        });

        it('should have scored the game', () => {
          expect(scoreSpy).to.have.been.calledOnce;
        });

        it('should reply to the interaction with the new round status', () => {
          expect(mockInteraction.reply).to.have.been.calledOnceWith(roundStatus(gameRef));
        });

        it('should message the user info about the round', () => {
          const clueGiver = mockUserManager.mockUserCache.get(gameRef.round.clueGiver);
          expect(clueGiver.send).to.have.been.calledOnce;
        });

        it('should update the pinned info', () => {
          expect(mockInteraction.editPinnedMsg).to.have.been.calledOnceWith(gameInfo(gameRef));
        });
      });

      context('if the guess was a bullseye', () => {
        beforeEach(async () => {
          scoreSpy = sinon.spy(gameRef, 'score');
          gameRef.round.value = 50;
          gameRef.round.oGuess = 49;
          roundValue = gameRef.round.value;
          mockUserManager.mockUserCache.get(gameRef.round.clueGiver).send.resetHistory();
          mockInteraction.channelSend.resetHistory();
          mockInteraction.reply.resetHistory();
          mockInteraction.editPinnedMsg.resetHistory();
          await command.execute(mockInteraction.interactionInstance, gameManager,
            clueManager, mockUserManager.userManagerInstance, dbServiceInstance);
        });

        it('should send a message to the channel with the results', () => {
          const scoringResults: ScoringResults = scoreSpy.returnValues[0];
          const expectedMessage = command.resolveGuessMessage(scoringResults, {
            round: {
              dGuess: true,
              value: roundValue,
            },
            defenseTeamNumber: () => 2,
            offenseTeamNumber: () => 1,
          });
          expect(mockInteraction.channelSend.getCall(0).args[0]).to.equal(expectedMessage);
        });

        it('should send a message to the channel with the point gains', () => {
          const scoringResults: ScoringResults = scoreSpy.returnValues[0];
          const expectedMessage = command.pointChange(scoringResults, gameRef);
          expect(mockInteraction.channelSend.getCall(1).args[0]).to.equal(expectedMessage);
        });

        it('should have scored the game', () => {
          expect(scoreSpy).to.have.been.calledOnce;
        });

        it('should reply to the interaction with the new round status', () => {
          expect(mockInteraction.reply).to.have.been.calledOnceWith(roundStatus(gameRef));
        });

        it('should message the user info about the round', () => {
          const clueGiver = mockUserManager.mockUserCache.get(gameRef.round.clueGiver);
          expect(clueGiver.send).to.have.been.calledOnce;
        });

        it('should update the pinned info', () => {
          expect(mockInteraction.editPinnedMsg).to.have.been.calledOnceWith(gameInfo(gameRef));
        });
      });

      context('if the guess triggers catchup', () => {
        let roundEndSpy: sinon.SinonSpy; 
        beforeEach(async () => {
          roundEndSpy = sinon.spy(gameRef, 'endRound');
          scoreSpy = sinon.spy(gameRef, 'score');
          gameRef.team1.points = 0;
          gameRef.team2.points = 9;
          gameRef.round.value = 50;
          gameRef.round.oGuess = 49;
          gameRef.setSettings({
            threshold: 10,
            asyncPlay: true,
            trackStats: false,
            dGuessTime: 0,
            oGuessTime: 0
          });
          roundValue = gameRef.round.value;
          mockUserManager.mockUserCache.get(gameRef.round.clueGiver).send.resetHistory();
          mockInteraction.channelSend.resetHistory();
          mockInteraction.reply.resetHistory();
          mockInteraction.editPinnedMsg.resetHistory();
          await command.execute(mockInteraction.interactionInstance, gameManager,
            clueManager, mockUserManager.userManagerInstance, dbServiceInstance);
        });

        it('should send a message to the channel with the results', () => {
          const scoringResults: ScoringResults = scoreSpy.returnValues[0];
          const expectedMessage = command.resolveGuessMessage(scoringResults, {
            round: {
              dGuess: true,
              value: roundValue,
            },
            defenseTeamNumber: () => 2,
            offenseTeamNumber: () => 1,
          });
          expect(mockInteraction.channelSend.getCall(0).args[0]).to.equal(expectedMessage);
        });

        it('should send a message to the channel with the point gains', () => {
          const scoringResults: ScoringResults = scoreSpy.returnValues[0];
          const expectedMessage = command.pointChange(scoringResults, gameRef);
          expect(mockInteraction.channelSend.getCall(1).args[0]).to.equal(expectedMessage);
        });

        it('should send a message to the channel indicating that catch was triggered', () => {
          expect(mockInteraction.channelSend.getCall(2).args[0]).to.equal(command.catchupTriggered(1));
        });

        it('should indicate that catchup was triggered when ending the round', () => {
          expect(roundEndSpy).to.have.been.calledOnceWith(true);
        });

        it('should have scored the game', () => {
          expect(scoreSpy).to.have.been.calledOnce;
        });

        it('should reply to the interaction with the new round status', () => {
          expect(mockInteraction.reply).to.have.been.calledOnceWith(roundStatus(gameRef));
        });

        it('should message the user info about the round', () => {
          const clueGiver = mockUserManager.mockUserCache.get(gameRef.round.clueGiver);
          expect(clueGiver.send).to.have.been.calledOnce;
        });

        it('should update the pinned info', () => {
          expect(mockInteraction.editPinnedMsg).to.have.been.calledOnceWith(gameInfo(gameRef));
        });
      });

      context('if the guess ends the game', () => {
        let endGameSpy: sinon.SinonSpy;
        beforeEach(async () => {
          scoreSpy = sinon.spy(gameRef, 'score');
          endGameSpy = sinon.spy(gameRef, 'endGame');
          gameRef.team1.points = 9;
          gameRef.team2.points = 0;
          gameRef.round.value = 50;
          gameRef.round.oGuess = 50;
          gameRef.setSettings({
            threshold: 10,
            asyncPlay: true,
            trackStats: false,
            dGuessTime: 0,
            oGuessTime: 0
          });
          roundValue = gameRef.round.value;
          mockUserManager.mockUserCache.get(gameRef.round.clueGiver).send.resetHistory();
          mockInteraction.channelSend.resetHistory();
          mockInteraction.reply.resetHistory();
          mockInteraction.editPinnedMsg.resetHistory();
          mockInteraction.messageUnpin.resetHistory();
          await command.execute(mockInteraction.interactionInstance, gameManager,
            clueManager, mockUserManager.userManagerInstance, dbServiceInstance);
        });

        it('should end the game', () => {
          expect(endGameSpy).to.have.been.calledOnce;
        });

        it('should reply that Team 1 has won the game', () => {
          expect(mockInteraction.reply).to.have.been.calledOnceWith(command.
            gameEndScoreboard(gameRef, 'Team 1'));
        });

        it('should unpin the pinned msg from the game', () => {
          expect(mockInteraction.messageUnpin).to.have.been.calledOnce;
          expect(gameRef.pinnedInfo).to.be.undefined;
        });

        it('should send a message to the channel with the results', () => {
          const scoringResults: ScoringResults = scoreSpy.returnValues[0];
          const expectedMessage = command.resolveGuessMessage(scoringResults, {
            round: {
              dGuess: true,
              value: roundValue
            },
            defenseTeamNumber: () => 2,
            offenseTeamNumber: () => 1,
          });
          expect(mockInteraction.channelSend.getCall(0).args[0]).to.equal(expectedMessage);
        });

        it('should send a message to the channel with the point gains', () => {
          const scoringResults: ScoringResults = scoreSpy.returnValues[0];
          const expectedMessage = command.pointChange(scoringResults, gameRef);
          expect(mockInteraction.channelSend.getCall(1).args[0]).to.equal(expectedMessage);
        });
      });
    });
  });

  context('guess lower subcommand', () => {
    beforeEach(async () => {
      mockInteraction.setSubcommandInput('lower')
      gameRef = new Game(TEST_CHANNEL_ID, []);
      mockPlayerList = [player1, player2, player3, player4];
      mockPlayerList.forEach(player => gameRef.players.add(player.userId));;
      gameRef.pinnedInfo = mockInteraction.messageInstance;
      gameRef.start();

      gameRef.round.value = 50;
      gameManager.addGame(TEST_CHANNEL_ID, gameRef);
    });

    context('if the user is not on the defense team', () => {
      beforeEach(async () => {
        gameRef.currentClue = 'something really cool';
        gameRef.round.clueGiver = player2.userId;
        gameRef.team1.players.push(player1.userId, player2.userId);
        gameRef.team2.players.push(player3.userId, player4.userId);
        mockInteraction.reply.resetHistory();
        await command.execute(mockInteraction.interactionInstance, gameManager,
          clueManager, mockUserManager.userManagerInstance, dbServiceInstance);
      });

      it('should reply that only players on the defense team can counter', () => {
        expect(mockInteraction.reply).to.have.been.calledOnceWith(command.wrongTeamCannotCounter(2));
      });
    });

    context('if an offensive guess has not been made yet', () => {
      beforeEach(async () => {
        gameRef.currentClue = 'something really cool';
        gameRef.round.oGuess = undefined;
        gameRef.round.clueGiver = player2.userId;
        gameRef.team1.players.push(player2.userId, player3.userId);
        gameRef.team2.players.push(player1.userId, player4.userId);
        mockInteraction.reply.resetHistory();
        await command.execute(mockInteraction.interactionInstance, gameManager,
          clueManager, mockUserManager.userManagerInstance, dbServiceInstance);
      });

      it('should reply there is\'nt a guess yet', () => {
        expect(mockInteraction.reply).to.have.been.calledOnceWith(command.noGuessYet);
      });
    });

    context('if all parameters are correct', () => {
      let scoreSpy: sinon.SinonSpy;
      beforeEach(() => {
        gameRef.currentClue = 'something really cool';
        gameRef.round.clueGiver = player2.userId;
        gameRef.team1.players.push(player2.userId, player3.userId);
        gameRef.team2.players.push(player1.userId, player4.userId);
        gameRef.round.oTeam = gameRef.team1;
        gameRef.round.dTeam = gameRef.team2;
        gameRef.pinnedInfo = mockInteraction.messageInstance;
      });

      context('if the counter guess is incorrect', () => {
        beforeEach(async () => {
          scoreSpy = sinon.spy(gameRef, 'score');
          gameRef.round.value = 50;
          gameRef.round.oGuess = 42;
          roundValue = gameRef.round.value;
          mockUserManager.mockUserCache.get(gameRef.round.clueGiver).send.resetHistory();
          mockInteraction.channelSend.resetHistory();
          mockInteraction.reply.resetHistory();
          mockInteraction.editPinnedMsg.resetHistory();
          await command.execute(mockInteraction.interactionInstance, gameManager,
            clueManager, mockUserManager.userManagerInstance, dbServiceInstance);
        });

        it('should send a message to the channel with the results', () => {
          const scoringResults: ScoringResults = scoreSpy.returnValues[0];
          const expectedMessage = command.resolveGuessMessage(scoringResults, {
            round: {
              dGuess: false,
              value: roundValue
            },
            defenseTeamNumber: () => 2,
            offenseTeamNumber: () => 1,
          });
          expect(mockInteraction.channelSend.getCall(0).args[0]).to.equal(expectedMessage);
        });

        it('should send a message to the channel with the point gains', () => {
          const scoringResults: ScoringResults = scoreSpy.returnValues[0];
          const expectedMessage = command.pointChange(scoringResults, gameRef);
          expect(mockInteraction.channelSend.getCall(1).args[0]).to.equal(expectedMessage);
        });

        it('should have scored the game', () => {
          expect(scoreSpy).to.have.been.calledOnce;
        });
    
        it('should reply to the interaction with the new round status', () => {
          expect(mockInteraction.reply).to.have.been.calledOnceWith(roundStatus(gameRef));
        });

        it('should message the user info about the round', () => {
          const clueGiver = mockUserManager.mockUserCache.get(gameRef.round.clueGiver);
          expect(clueGiver.send).to.have.been.calledOnce;
        });

        it('should update the pinned info', () => {
          expect(mockInteraction.editPinnedMsg).to.have.been.calledOnceWith(gameInfo(gameRef));
        });
      });

      context('if the counter guess is correct', () => {
        beforeEach(async () => {
          scoreSpy = sinon.spy(gameRef, 'score');
          gameRef.round.value = 50;
          gameRef.round.oGuess = 69;
          roundValue = gameRef.round.value;
          mockUserManager.mockUserCache.get(gameRef.round.clueGiver).send.resetHistory();
          mockInteraction.channelSend.resetHistory();
          mockInteraction.reply.resetHistory();
          mockInteraction.editPinnedMsg.resetHistory();
          await command.execute(mockInteraction.interactionInstance, gameManager,
            clueManager, mockUserManager.userManagerInstance, dbServiceInstance);
        });

        it('should send a message to the channel with the results', () => {
          const scoringResults: ScoringResults = scoreSpy.returnValues[0];
          const expectedMessage = command.resolveGuessMessage(scoringResults, {
            round: {
              dGuess: false,
              value: roundValue
            },
            defenseTeamNumber: () => 2,
            offenseTeamNumber: () => 1,
          });
          expect(mockInteraction.channelSend.getCall(0).args[0]).to.equal(expectedMessage);
        });

        it('should send a message to the channel with the point gains', () => {
          const scoringResults: ScoringResults = scoreSpy.returnValues[0];
          const expectedMessage = command.pointChange(scoringResults, gameRef);
          expect(mockInteraction.channelSend.getCall(1).args[0]).to.equal(expectedMessage);
        });

        it('should have scored the game', () => {
          expect(scoreSpy).to.have.been.calledOnce;
        });

        it('should reply to the interaction with the new round status', () => {
          expect(mockInteraction.reply).to.have.been.calledOnceWith(roundStatus(gameRef));
        });

        it('should message the user info about the round', () => {
          const clueGiver = mockUserManager.mockUserCache.get(gameRef.round.clueGiver);
          expect(clueGiver.send).to.have.been.calledOnce;
        });

        it('should update the pinned info', () => {
          expect(mockInteraction.editPinnedMsg).to.have.been.calledOnceWith(gameInfo(gameRef));
        });
      });

      context('if the guess was a bullseye', () => {
        beforeEach(async () => {
          scoreSpy = sinon.spy(gameRef, 'score');
          gameRef.round.value = 50;
          gameRef.round.oGuess = 50;
          roundValue = gameRef.round.value;
          mockUserManager.mockUserCache.get(gameRef.round.clueGiver).send.resetHistory();
          mockInteraction.channelSend.resetHistory();
          mockInteraction.reply.resetHistory();
          mockInteraction.editPinnedMsg.resetHistory();
          await command.execute(mockInteraction.interactionInstance, gameManager,
            clueManager, mockUserManager.userManagerInstance, dbServiceInstance);
        });

        it('should send a message to the channel with the results', () => {
          const scoringResults: ScoringResults = scoreSpy.returnValues[0];
          const expectedMessage = command.resolveGuessMessage(scoringResults, {
            round: {
              dGuess: false,
              value: roundValue,
            },
            defenseTeamNumber: () => 2,
            offenseTeamNumber: () => 1,
          });
          expect(mockInteraction.channelSend.getCall(0).args[0]).to.equal(expectedMessage);
        });

        it('should send a message to the channel with the point gains', () => {
          const scoringResults: ScoringResults = scoreSpy.returnValues[0];
          const expectedMessage = command.pointChange(scoringResults, gameRef);
          expect(mockInteraction.channelSend.getCall(1).args[0]).to.equal(expectedMessage);
        });

        it('should have scored the game', () => {
          expect(scoreSpy).to.have.been.calledOnce;
        });

        it('should reply to the interaction with the new round status', () => {
          expect(mockInteraction.reply).to.have.been.calledOnceWith(roundStatus(gameRef));
        });

        it('should message the user info about the round', () => {
          const clueGiver = mockUserManager.mockUserCache.get(gameRef.round.clueGiver);
          expect(clueGiver.send).to.have.been.calledOnce;
        });

        it('should update the pinned info', () => {
          expect(mockInteraction.editPinnedMsg).to.have.been.calledOnceWith(gameInfo(gameRef));
        });
      });

      context('if the guess ends the game', () => {
        let endGameSpy: sinon.SinonSpy;
        beforeEach(async () => {
          scoreSpy = sinon.spy(gameRef, 'score');
          endGameSpy = sinon.spy(gameRef, 'endGame');
          gameRef.team1.points = 9;
          gameRef.team2.points = 0;
          gameRef.round.value = 50;
          gameRef.round.oGuess = 60;
          gameRef.setSettings({
            threshold: 10,
            asyncPlay: true,
            trackStats: false,
            dGuessTime: 0,
            oGuessTime: 0
          });
          roundValue = gameRef.round.value;
          mockUserManager.mockUserCache.get(gameRef.round.clueGiver).send.resetHistory();
          mockInteraction.channelSend.resetHistory();
          mockInteraction.reply.resetHistory();
          mockInteraction.editPinnedMsg.resetHistory();
          mockInteraction.messageUnpin.resetHistory();
          await command.execute(mockInteraction.interactionInstance, gameManager,
            clueManager, mockUserManager.userManagerInstance, dbServiceInstance);
        });

        it('should end the game', () => {
          expect(endGameSpy).to.have.been.calledOnce;
        });

        it('should reply that Team 1 has won the game', () => {
          expect(mockInteraction.reply).to.have.been.calledOnceWith(command.
            gameEndScoreboard(gameRef, 'Team 1'));
        });

        it('should unpin the pinned msg from the game', () => {
          expect(mockInteraction.messageUnpin).to.have.been.calledOnce;
          expect(gameRef.pinnedInfo).to.be.undefined;
        });

        it('should send a message to the channel with the results', () => {
          const scoringResults: ScoringResults = scoreSpy.returnValues[0];
          const expectedMessage = command.resolveGuessMessage(scoringResults, {
            round: {
              dGuess: false,
              value: roundValue
            },
            defenseTeamNumber: () => 2,
            offenseTeamNumber: () => 1,
          });
          expect(mockInteraction.channelSend.getCall(0).args[0]).to.equal(expectedMessage);
        });

        it('should send a message to the channel with the point gains', () => {
          const scoringResults: ScoringResults = scoreSpy.returnValues[0];
          const expectedMessage = command.pointChange(scoringResults, gameRef);
          expect(mockInteraction.channelSend.getCall(1).args[0]).to.equal(expectedMessage);
        });
      });
    });
  });
});