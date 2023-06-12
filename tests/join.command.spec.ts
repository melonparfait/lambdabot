import { expect } from 'chai';
import { MockInteraction } from '../src/utils/testing-helpers';
import * as chai from 'chai';
import * as sinon from 'sinon';
import { GameManager } from '../src/services/game-manager';
import { ClueManager } from '../src/services/clue-manager';
import { Game } from '../src/models/game';
import * as JoinCommand from '../src/commands/join.command';
import { alreadyInGame, gameInProgress, getGameDetails, noActiveGameMessage, userJoinedGame } from '../src/helpers/print.gameinfo';
import { LambdabotCommand } from '../src/helpers/lambda.interface';
import * as _ from 'lodash';

const TEST_USER_ID = '54321';
const TEST_CHANNEL_ID = '12345';

describe('join command', () => {
  chai.use(require('sinon-chai'));
  let mockInteraction: MockInteraction;
  let command: LambdabotCommand & any;
  let gameManager: GameManager;
  let clueManager: ClueManager;

  beforeEach(() => {
    command = <LambdabotCommand><unknown>require('../src/commands/join.command');
    gameManager = new GameManager();
    clueManager = new ClueManager();

    command.gameManager = gameManager;
    command.clueManager = clueManager;
    mockInteraction = new MockInteraction(TEST_USER_ID, TEST_CHANNEL_ID);
  });

  it('should create', () => {
    expect(command).to.be.ok;
  });

  context('if there is no game in the channel', () => {
    beforeEach(async () => {
      mockInteraction.reply.resetHistory();
      await command.execute(mockInteraction.interactionInstance);
    });

    it('should tell the user that there is no active game', () => {
      expect(mockInteraction.reply).to.have.been.calledOnceWith(noActiveGameMessage);
    });
  });

  context('if there is a game but it\'s finished', () => {
    beforeEach(async () => {
      mockInteraction.reply.resetHistory();
      const gameRef = new Game(TEST_CHANNEL_ID, []);
      gameRef.status = 'finished';
      gameManager.addGame(TEST_CHANNEL_ID, gameRef);
      await command.execute(mockInteraction.interactionInstance);
    });

    it('should tell the user that there is no active game', () => {
      expect(mockInteraction.reply).to.have.been.calledOnceWith(noActiveGameMessage);
    });
  });

  context('if there is a game but it\'s in progress', () => {
    beforeEach(async () => {
      mockInteraction.reply.resetHistory();
      const gameRef = new Game(TEST_CHANNEL_ID, []);
      gameRef.status = 'playing';
      gameManager.addGame(TEST_CHANNEL_ID, gameRef);
      await command.execute(mockInteraction.interactionInstance);
    });

    it('should tell the user that there is a game in progress', () => {
      expect(mockInteraction.reply).to.have.been.calledOnceWith(gameInProgress);
    });
  });

  context('if there is a game and it\'s being setup', () => {
    let gameRef: Game;
    let joinSpy: sinon.SinonSpy;
    let addPlayerToTeamSpy: sinon.SinonSpy;

    beforeEach(() => {
      gameRef = new Game(TEST_CHANNEL_ID, []);
      gameRef.status = 'setup';
      gameRef.pinnedInfo = mockInteraction.messageInstance;
      joinSpy = sinon.spy(gameRef, 'join');
      addPlayerToTeamSpy = sinon.spy(gameRef, 'addPlayerToTeam');
      gameManager.addGame(TEST_CHANNEL_ID, gameRef);
    });

    context('if the user is not already in the game', () => {
      context('if the user provided no arguments', () => {
        beforeEach(async () => {
          mockInteraction.setInteractionInput('string', 'team', undefined);
          joinSpy.resetHistory();
          mockInteraction.editPinnedMsg.resetHistory();
          mockInteraction.reply.resetHistory();
          await command.execute(mockInteraction.interactionInstance);
        });

        it('should let the player join the game', () => {
          expect(joinSpy).to.have.been.calledOnceWith(TEST_USER_ID);
        });

        it('should update the pinned game info', () => {
          expect(mockInteraction.editPinnedMsg).to.have.been.calledOnce;
          const actualWithoutTimestamp = _.omit(mockInteraction.editPinnedMsg.lastCall.args[0].embeds[0], ['data', 'timestamp']);
          const expectedDetailsWithoutTimestamp = _.omit(getGameDetails(gameRef), ['data', 'timestamp']);
          expect(actualWithoutTimestamp).to.deep.equal(expectedDetailsWithoutTimestamp);
        });

        it('should send a reply with a message that the user joined the game', () => {
          expect(mockInteraction.reply).to.have.been.calledOnceWith(userJoinedGame(TEST_USER_ID));
        });
      });

      context('if the user asked to join team 1', () => {
        beforeEach(async () => {
          mockInteraction.setInteractionInput('string', 'team', '1');
          joinSpy.resetHistory();
          addPlayerToTeamSpy.resetHistory()
          mockInteraction.editPinnedMsg.resetHistory();
          mockInteraction.reply.resetHistory();
          await command.execute(mockInteraction.interactionInstance)
        });

        it('should let the player join the game', () => {
          expect(joinSpy).to.have.been.calledOnceWith(TEST_USER_ID);
        });

        it('should have added the player to team 1', () => {
          expect(addPlayerToTeamSpy).to.have.been.calledOnceWith(TEST_USER_ID, '1');
        });

        it('should update the pinned game info', () => {
          expect(mockInteraction.editPinnedMsg).to.have.been.calledOnce;
          const actualWithoutTimestamp = _.omit(mockInteraction.editPinnedMsg.lastCall.args[0].embeds[0], ['data', 'timestamp']);
          const expectedDetailsWithoutTimestamp = _.omit(getGameDetails(gameRef), ['data', 'timestamp']);
          expect(actualWithoutTimestamp).to.deep.equal(expectedDetailsWithoutTimestamp);
        });

        it('should send a reply that the user joined the game on team 1', () => {
          expect(mockInteraction.reply).to.have.been.calledOnceWith(command.teamJoinedMsg(true, TEST_USER_ID, '1'));
        });
      });

      context('if the user asked to join team 2', () => {
        beforeEach(async () => {
          mockInteraction.setInteractionInput('string', 'team', '2');
          joinSpy.resetHistory();
          addPlayerToTeamSpy.resetHistory();
          mockInteraction.editPinnedMsg.resetHistory();
          mockInteraction.reply.resetHistory();
          await command.execute(mockInteraction.interactionInstance)
        });

        it('should let the player join the game', () => {
          expect(joinSpy).to.have.been.calledOnceWith(TEST_USER_ID);
        });

        it('should have added the player to team 2', () => {
          expect(addPlayerToTeamSpy).to.have.been.calledOnceWith(TEST_USER_ID, '2');
        });

        it('should update the pinned game info', () => {
          expect(mockInteraction.editPinnedMsg).to.have.been.calledOnce;
          const actualWithoutTimestamp = _.omit(mockInteraction.editPinnedMsg.lastCall.args[0].embeds[0], ['data', 'timestamp']);
          const expectedDetailsWithoutTimestamp = _.omit(getGameDetails(gameRef), ['data', 'timestamp']);
          expect(actualWithoutTimestamp).to.deep.equal(expectedDetailsWithoutTimestamp);
        });

        it('should send a reply that the user joined the game on team 2', () => {
          expect(mockInteraction.reply).to.have.been.calledOnceWith(command.teamJoinedMsg(true, TEST_USER_ID, '2'));
        });
      });

      context('if the user asked to join a random team', () => {
        beforeEach(async () => {
          mockInteraction.setInteractionInput('string', 'team', 'random');
          mockInteraction.editPinnedMsg.resetHistory();
          mockInteraction.reply.resetHistory();
          joinSpy.resetHistory();
          await command.execute(mockInteraction.interactionInstance)
        });

        it('should let the player join the game', () => {
          expect(joinSpy).to.have.been.calledOnceWith(TEST_USER_ID);
        });

        it('should have added the player to a team', () => {
          expect(addPlayerToTeamSpy).to.have.been.calledOnce;
        });

        it('should update the pinned game info', () => {
          expect(mockInteraction.editPinnedMsg).to.have.been.calledOnce;
          const actualWithoutTimestamp = _.omit(mockInteraction.editPinnedMsg.lastCall.args[0].embeds[0], ['data', 'timestamp']);
          const expectedDetailsWithoutTimestamp = _.omit(getGameDetails(gameRef), ['data', 'timestamp']);
          expect(actualWithoutTimestamp).to.deep.equal(expectedDetailsWithoutTimestamp);
        });

        it('should send a reply that the user joined the game on a team', () => {
          expect(mockInteraction.reply).to.have.been.calledOnce;
        });
      });

      context('if the user asked to join neither team', () => {
        beforeEach(async () => {
          mockInteraction.setInteractionInput('string', 'team', 'no_team');
          mockInteraction.reply.resetHistory();
          await command.execute(mockInteraction.interactionInstance)
        });

        it('should reply that the user joined the game', () => {
          expect(mockInteraction.reply).to.have.been.calledOnceWith(userJoinedGame(TEST_USER_ID));
        });
      });
    });

    context('if the user is already in the game', () => {
      beforeEach(() => {
        gameRef.join(TEST_USER_ID);
        gameManager.addGame(TEST_CHANNEL_ID, gameRef);
      });

      context('if the user is on team 1', () => {
        beforeEach(() => {
          gameRef.team1.players.push(TEST_USER_ID);
          gameManager.addGame(TEST_CHANNEL_ID, gameRef);
        });
        context('if the user provided no arguments', () => {
          beforeEach(async () => {
            mockInteraction.setInteractionInput('string', 'team', undefined);
            joinSpy.resetHistory();
            mockInteraction.editPinnedMsg.resetHistory();
            mockInteraction.reply.resetHistory();
            await command.execute(mockInteraction.interactionInstance)
          });
  
          it('should send a reply that the user is already in the game', () => {
            expect(mockInteraction.reply).to.have.been.calledOnceWith(alreadyInGame);
          });
        });
  
        context('if the user asked to join team 1', () => {
          beforeEach(async () => {
            mockInteraction.setInteractionInput('string', 'team', '1');
            mockInteraction.reply.resetHistory();
            await command.execute(mockInteraction.interactionInstance)
          });
  
          it('should send a reply that the user is already on team 1', () => {
            expect(mockInteraction.reply).to.have.been.calledOnceWith(command.alreadyOnTeam('1'));
          });
        });
  
        context('if the user asked to join team 2', () => {
          beforeEach(async () => {
            mockInteraction.setInteractionInput('string', 'team', '2');
            joinSpy.resetHistory();
            addPlayerToTeamSpy.resetHistory();
            mockInteraction.editPinnedMsg.resetHistory();
            mockInteraction.reply.resetHistory();
            await command.execute(mockInteraction.interactionInstance)
          });
  
          it('should let the player join the game', () => {
            expect(joinSpy).to.have.been.calledOnceWith(TEST_USER_ID);
          });
  
          it('should have added the player to team 2', () => {
            expect(addPlayerToTeamSpy).to.have.been.calledOnceWith(TEST_USER_ID, '2');
          });
  
          it('should update the pinned game info', () => {
            expect(mockInteraction.editPinnedMsg).to.have.been.calledOnce;
            const actualWithoutTimestamp = _.omit(mockInteraction.editPinnedMsg.lastCall.args[0].embeds[0], ['data', 'timestamp']);
            const expectedDetailsWithoutTimestamp = _.omit(getGameDetails(gameRef), ['data', 'timestamp']);
            expect(actualWithoutTimestamp).to.deep.equal(expectedDetailsWithoutTimestamp);
          });
  
          it('should send a reply that the user joined the game on team 2', () => {
            expect(mockInteraction.reply).to.have.been.calledOnceWith(command.teamJoinedMsg(false, TEST_USER_ID, '2'));
          });
        });
  
        context('if the user asked to join a random team', () => {
          beforeEach(async () => {
            mockInteraction.setInteractionInput('string', 'team', 'random');
            joinSpy.resetHistory();
            mockInteraction.editPinnedMsg.resetHistory();
            mockInteraction.reply.resetHistory();
            await command.execute(mockInteraction.interactionInstance, gameManager)
          });
  
          it('should let the player join the game', () => {
            expect(joinSpy).to.have.been.calledOnceWith(TEST_USER_ID);
          });
  
          it('should have added the player to a team', () => {
            expect(addPlayerToTeamSpy).to.have.been.calledOnce;
          });
  
          it('should update the pinned game info', () => {
            expect(mockInteraction.editPinnedMsg).to.have.been.calledOnce;
            const actualWithoutTimestamp = _.omit(mockInteraction.editPinnedMsg.lastCall.args[0].embeds[0], ['data', 'timestamp']);
            const expectedDetailsWithoutTimestamp = _.omit(getGameDetails(gameRef), ['data', 'timestamp']);
            expect(actualWithoutTimestamp).to.deep.equal(expectedDetailsWithoutTimestamp);
          });
  
          it('should send a reply that the user joined the game on a team', () => {
            expect(mockInteraction.reply).to.have.been.calledOnce;
          });
        });
  
        context('if the user asked to join neither team', () => {
          let unassignSpy: sinon.SinonSpy;
          beforeEach(async () => {
            unassignSpy = sinon.spy(gameRef, 'movePlayerToUnassignedTeam');
            mockInteraction.setInteractionInput('string', 'team', 'no_team');
            mockInteraction.reply.resetHistory();
            await command.execute(mockInteraction.interactionInstance)
          });
  
          it('should reply that the user left their previous team', () => {
            expect(mockInteraction.reply).to.have.been.calledOnceWith(command.userLeftTeam(TEST_USER_ID, '1'));
          });

          it('should move the player out of team 1', () => {
            expect(unassignSpy).to.have.been.calledOnceWith(TEST_USER_ID);
          });
        });
      });

      context('if the user is on team 2', () => {
        beforeEach(() => {
          gameRef.team2.players.push(TEST_USER_ID);
          gameManager.addGame(TEST_CHANNEL_ID, gameRef);
        });
        context('if the user provided no arguments', () => {
          beforeEach(async () => {
            mockInteraction.setInteractionInput('string', 'team', undefined);
            joinSpy.resetHistory();
            mockInteraction.editPinnedMsg.resetHistory();
            mockInteraction.reply.resetHistory();
            await command.execute(mockInteraction.interactionInstance)
          });
  
          it('should send a reply that the user is already in the game', () => {
            expect(mockInteraction.reply).to.have.been.calledOnceWith(alreadyInGame);
          });
        });
  
        context('if the user asked to join team 1', () => {
          beforeEach(async () => {
            mockInteraction.setInteractionInput('string', 'team', '1');
            joinSpy.resetHistory();
            addPlayerToTeamSpy.resetHistory()
            mockInteraction.editPinnedMsg.resetHistory();
            mockInteraction.reply.resetHistory();
            await command.execute(mockInteraction.interactionInstance)
          });
  
          it('should let the player join the game', () => {
            expect(joinSpy).to.have.been.calledOnceWith(TEST_USER_ID);
          });
  
          it('should have added the player to team 1', () => {
            expect(addPlayerToTeamSpy).to.have.been.calledOnceWith(TEST_USER_ID, '1');
          });
  
          it('should update the pinned game info', () => {
            expect(mockInteraction.editPinnedMsg).to.have.been.calledOnce;
            const actualWithoutTimestamp = _.omit(mockInteraction.editPinnedMsg.lastCall.args[0].embeds[0], ['data', 'timestamp']);
            const expectedDetailsWithoutTimestamp = _.omit(getGameDetails(gameRef), ['data', 'timestamp']);
            expect(actualWithoutTimestamp).to.deep.equal(expectedDetailsWithoutTimestamp);
          });
  
          it('should send a reply that the user joined the game on team 1', () => {
            expect(mockInteraction.reply).to.have.been.calledOnceWith(command.teamJoinedMsg(false, TEST_USER_ID, '1'));
          });
        });
  
        context('if the user asked to join team 2', () => {
          beforeEach(async () => {
            mockInteraction.setInteractionInput('string', 'team', '2');
            mockInteraction.reply.resetHistory();
            await command.execute(mockInteraction.interactionInstance)
          });
  
          it('should send a reply that the user is already on team 1', () => {
            expect(mockInteraction.reply).to.have.been.calledOnceWith(command.alreadyOnTeam('2'));
          });
        });
  
        context('if the user asked to join a random team', () => {
          beforeEach(async () => {
            mockInteraction.setInteractionInput('string', 'team', 'random');
            joinSpy.resetHistory();
            mockInteraction.editPinnedMsg.resetHistory();
            mockInteraction.reply.resetHistory();
            await command.execute(mockInteraction.interactionInstance)
          });
  
          it('should let the player join the game', () => {
            expect(joinSpy).to.have.been.calledOnceWith(TEST_USER_ID);
          });
  
          it('should have added the player to a team', () => {
            expect(addPlayerToTeamSpy).to.have.been.calledOnce;
          });
  
          it('should update the pinned game info', () => {
            expect(mockInteraction.editPinnedMsg).to.have.been.calledOnce;
            const actualWithoutTimestamp = _.omit(mockInteraction.editPinnedMsg.lastCall.args[0].embeds[0], ['data', 'timestamp']);
            const expectedDetailsWithoutTimestamp = _.omit(getGameDetails(gameRef), ['data', 'timestamp']);
            expect(actualWithoutTimestamp).to.deep.equal(expectedDetailsWithoutTimestamp);
          });
  
          it('should send a reply that the user joined the game on a team', () => {
            expect(mockInteraction.reply).to.have.been.calledOnce;
          });
        });
  
        context('if the user asked to join neither team', () => {
          let unassignSpy: sinon.SinonSpy;
          beforeEach(async () => {
            unassignSpy = sinon.spy(gameRef, 'movePlayerToUnassignedTeam');
            mockInteraction.setInteractionInput('string', 'team', 'no_team');
            mockInteraction.reply.resetHistory();
            await command.execute(mockInteraction.interactionInstance)
          });
  
          it('should reply that the user left their previous team', () => {
            expect(mockInteraction.reply).to.have.been.calledOnceWith(command.userLeftTeam(TEST_USER_ID, '2'));
          });

          it('should move the player out of team 1', () => {
            expect(unassignSpy).to.have.been.calledOnceWith(TEST_USER_ID);
          });
        });
      });

      context('if the user is not on a team', () => {
        context('if the user provided no arguments', () => {
          beforeEach(async () => {
            mockInteraction.setInteractionInput('string', 'team', undefined);
            joinSpy.resetHistory();
            mockInteraction.editPinnedMsg.resetHistory();
            mockInteraction.reply.resetHistory();
            await command.execute(mockInteraction.interactionInstance)
          });
  
          it('should send a reply that the user is already in the game', () => {
            expect(mockInteraction.reply).to.have.been.calledOnceWith(alreadyInGame);
          });
        });
  
        context('if the user asked to join team 1', () => {
          beforeEach(async () => {
            mockInteraction.setInteractionInput('string', 'team', '1');
            joinSpy.resetHistory();
            addPlayerToTeamSpy.resetHistory()
            mockInteraction.editPinnedMsg.resetHistory();
            mockInteraction.reply.resetHistory();
            await command.execute(mockInteraction.interactionInstance)
          });
  
          it('should let the player join the game', () => {
            expect(joinSpy).to.have.been.calledOnceWith(TEST_USER_ID);
          });
  
          it('should have added the player to team 1', () => {
            expect(addPlayerToTeamSpy).to.have.been.calledOnceWith(TEST_USER_ID, '1');
          });
  
          it('should update the pinned game info', () => {
            expect(mockInteraction.editPinnedMsg).to.have.been.calledOnce;
            const actualWithoutTimestamp = _.omit(mockInteraction.editPinnedMsg.lastCall.args[0].embeds[0], ['data', 'timestamp']);
            const expectedDetailsWithoutTimestamp = _.omit(getGameDetails(gameRef), ['data', 'timestamp']);
            expect(actualWithoutTimestamp).to.deep.equal(expectedDetailsWithoutTimestamp);
          });
  
          it('should send a reply that the user joined the game on team 1', () => {
            expect(mockInteraction.reply).to.have.been.calledOnceWith(command.teamJoinedMsg(false, TEST_USER_ID, '1'));
          });
        });
  
        context('if the user asked to join team 2', () => {
          beforeEach(async () => {
            mockInteraction.setInteractionInput('string', 'team', '2');
            joinSpy.resetHistory();
            addPlayerToTeamSpy.resetHistory();
            mockInteraction.editPinnedMsg.resetHistory();
            mockInteraction.reply.resetHistory();
            await command.execute(mockInteraction.interactionInstance)
          });
  
          it('should let the player join the game', () => {
            expect(joinSpy).to.have.been.calledOnceWith(TEST_USER_ID);
          });
  
          it('should have added the player to team 2', () => {
            expect(addPlayerToTeamSpy).to.have.been.calledOnceWith(TEST_USER_ID, '2');
          });
  
          it('should update the pinned game info', () => {
            expect(mockInteraction.editPinnedMsg).to.have.been.calledOnce;
            const actualWithoutTimestamp = _.omit(mockInteraction.editPinnedMsg.lastCall.args[0].embeds[0], ['data', 'timestamp']);
            const expectedDetailsWithoutTimestamp = _.omit(getGameDetails(gameRef), ['data', 'timestamp']);
            expect(actualWithoutTimestamp).to.deep.equal(expectedDetailsWithoutTimestamp);
          });
  
          it('should send a reply that the user joined the game on team 2', () => {
            expect(mockInteraction.reply).to.have.been.calledOnceWith(command.teamJoinedMsg(false, TEST_USER_ID, '2'));
          });
        });
  
        context('if the user asked to join a random team', () => {
          beforeEach(async () => {
            mockInteraction.setInteractionInput('string', 'team', 'random');
            joinSpy.resetHistory();
            mockInteraction.editPinnedMsg.resetHistory();
            mockInteraction.reply.resetHistory();
            await command.execute(mockInteraction.interactionInstance)
          });
  
          it('should let the player join the game', () => {
            expect(joinSpy).to.have.been.calledOnceWith(TEST_USER_ID);
          });
  
          it('should have added the player to a team', () => {
            expect(addPlayerToTeamSpy).to.have.been.calledOnce;
          });
  
          it('should update the pinned game info', () => {
            expect(mockInteraction.editPinnedMsg).to.have.been.calledOnce;
            const actualWithoutTimestamp = _.omit(mockInteraction.editPinnedMsg.lastCall.args[0].embeds[0], ['data', 'timestamp']);
            const expectedDetailsWithoutTimestamp = _.omit(getGameDetails(gameRef), ['data', 'timestamp']);
            expect(actualWithoutTimestamp).to.deep.equal(expectedDetailsWithoutTimestamp);
          });
  
          it('should send a reply that the user joined the game on a team', () => {
            expect(mockInteraction.reply).to.have.been.calledOnce;
          });
        });
  
        context('if the user asked to join neither team', () => {
          beforeEach(async () => {
            mockInteraction.setInteractionInput('string', 'team', 'no_team');
            mockInteraction.reply.resetHistory();
            await command.execute(mockInteraction.interactionInstance)
          });
  
          it('should reply that the user is already in the game', () => {
            expect(mockInteraction.reply).to.have.been.calledOnceWith(alreadyInGame);
          });
        });
      });

    });
  });
});
