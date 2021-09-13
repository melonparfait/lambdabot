import { expect } from 'chai';
import * as NewGameCommand from '../src/commands/newgame.new.command';
import { CommandArgType, MockInteraction } from '../src/utils/testing-helpers';
import * as chai from 'chai';
import Sinon, { SinonStub } from 'sinon';
import { GameManager } from '../src/game-manager';
import { ClueManager } from '../src/clue-manager';
import { Game } from '../src/models/game';
import { CommandInteraction, TextBasedChannel, TextBasedChannels } from 'discord.js';
import { anyString, anything, instance, mock, verify, when } from 'ts-mockito';

const TEST_USER_ID = '54321';
const TEST_CHANNEL_ID = '12345';
const sinon = require('sinon');

describe.only('newgame command', () => {
  chai.use(require('sinon-chai'));
  let mockInteraction: MockInteraction;
  let command: any;
  let gameManager: GameManager;
  let clueManager: ClueManager;

  beforeEach(() => {
    command = NewGameCommand;
    gameManager = new GameManager();
    clueManager = new ClueManager();
    mockInteraction = new MockInteraction(TEST_USER_ID, TEST_CHANNEL_ID);
  });

  it('should create', () => {
    expect(command).to.be.ok;
  });

  describe('when a game already exists in the channel', () => {
    beforeEach(() => {
      gameManager.addGame(TEST_CHANNEL_ID, new Game(TEST_CHANNEL_ID, [], undefined, 'oldGame'));
    });

    context('if the game is in the setup status', () => {
      beforeEach(async () => {
        mockInteraction.reply.resetHistory();
        gameManager.getGame(TEST_CHANNEL_ID).status = 'setup';
        await command.execute(mockInteraction.interactionInstance, gameManager, clueManager);
      });

      it('should tell the user that the game is already running', () => {
        expect(mockInteraction.reply).to.have.been.calledOnceWith({
          content: 'It looks like there\'s already a game running in this channel.',
          ephemeral: true
        });
      });
    });

    context('if the game is in the playing status', () => {
      beforeEach(async () => {
        mockInteraction.reply.resetHistory();
        gameManager.getGame(TEST_CHANNEL_ID).status = 'playing';
        await command.execute(mockInteraction.interactionInstance, gameManager, clueManager);
      });

      it('should tell the user that the game is already running', () => {
        expect(mockInteraction.reply).to.have.been.calledOnceWith({
          content: 'It looks like there\'s already a game running in this channel.',
          ephemeral: true
        });
      });
    });

    context('if the game is in the finished status', () => {
      let oldId: string;
      beforeEach(async () => {
        gameManager.getGame(TEST_CHANNEL_ID).status = 'finished';
        oldId = gameManager.getGame(TEST_CHANNEL_ID).id;
        await command.execute(mockInteraction.interactionInstance, gameManager, clueManager);
      });

      it('should replace the old game with a new one', () => {
        const newId = gameManager.getGame(TEST_CHANNEL_ID).id;
        expect(oldId).to.not.equal(newId);
      });
    });

  });
});