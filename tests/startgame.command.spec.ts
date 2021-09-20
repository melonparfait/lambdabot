import { expect } from 'chai';
import { CommandArgType, MockInteraction } from '../src/utils/testing-helpers';
import * as chai from 'chai';
import * as sinon from 'sinon';
import { GameManager } from '../src/game-manager';
import { ClueManager } from '../src/clue-manager';
import * as ConfigCommand from '../src/commands/config.new.command';
import { gameInfo, minimumDefenseTimerError, minimumThresholdError, maximumThresholdError, noActiveGameMessage, setupOnly, updateGameInfo } from '../src/helpers/print.gameinfo';
import { Game } from '../src/models/game';
import * as  StartGameCommand from '../src/commands/startgame.new.command';

const TEST_USER_ID = '54321';
const TEST_CHANNEL_ID = '12345';

describe('startgame command', () => {
  chai.use(require('sinon-chai'));
  let mockInteraction: MockInteraction;
  let command: any;
  let gameManager: GameManager;
  let clueManager: ClueManager;

  beforeEach(() => {
    command = StartGameCommand;
    gameManager = new GameManager();
    clueManager = new ClueManager();
    mockInteraction = new MockInteraction(TEST_USER_ID, TEST_CHANNEL_ID);
  });

  it('should create', () => {
    expect(command).to.be.ok;
  });
});