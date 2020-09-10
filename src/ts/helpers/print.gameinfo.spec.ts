import { describe } from 'mocha';
import { Game } from '../models/game';
import { gameSettings, clue, spectrumBar, updateGameInfo } from './print.gameinfo';
import { Round } from '../models/round';
import { GameTeam } from '../models/team';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { DiscordMessage } from './lambda.interface';

let game: Game;
let message: DiscordMessage;
const lastMessagePinSpy = sinon.spy();
const channelSendSpy = sinon.spy();

describe('Printing output tests', () => {
  beforeEach(() => { 
    game = new Game();
    message = <unknown>{ 
      client: { game: game },
      channel: {
        lastMessage: { pin: lastMessagePinSpy },
        send: channelSendSpy
      }
    } as DiscordMessage;
  })

  describe('game settings', () => {
    it('should print the game settings', () => {
      game.setSettings({ threshold: 10, asyncPlay: false, oGuessTime: 120, dGuessTime: 120});
      const printMsg = gameSettings(game);
      
      expect(printMsg).to.have.string('timer');
    });

    it('should not print timer if async is on', () => {
      game.setSettings({ threshold: 10, asyncPlay: true, oGuessTime: 120, dGuessTime: 120});
      const printMsg = gameSettings(game);

      expect(printMsg).to.not.have.string('timer');
    });
  });

  describe('clue', () => {
    let round: Round;
    beforeEach(() => {
      const team1 = new GameTeam();
      const team2 = new GameTeam();
      round = new Round(team1, team2);
      round.leftClue = "foo";
      round.rightClue = "bar";
    });

    xit('should print the clue', () => {
      console.log(clue(round, 30));
    });
  });

  describe('spectrum bar', () => {
    xit ('should print the spectrum bar', () => {
      console.log(spectrumBar(50));
      console.log(spectrumBar(20, 'lower'));
    });
  });

  describe('updateGameInfo', () => {
    xit('should update the game info', (done) => {
      updateGameInfo(message).then(() => {
        console.log('sendArgs: ', channelSendSpy.getCalls());
      }).then(done).catch(done);
    });
  });
})