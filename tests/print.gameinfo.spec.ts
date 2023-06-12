import { describe } from 'mocha';
import { Game } from '../src/models/game';
import { clue, gameSettingsEmbedFields, spectrumBar } from '../src/helpers/print.gameinfo';
import { Round } from '../src/models/round';
import { GameTeam } from '../src/models/team';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { DiscordMessage } from '../src/helpers/lambda.interface';

let game: Game;
let message: DiscordMessage;
const lastMessagePinSpy = sinon.spy();
const channelSendSpy = sinon.spy();

describe('Printing output tests', () => {
  beforeEach(() => {
    game = new Game('testGame', []);
    message = <unknown>{
      client: { game: game },
      channel: {
        lastMessage: { pin: lastMessagePinSpy },
        send: channelSendSpy,
      },
    } as DiscordMessage;
  });

  xdescribe('game settings', () => {
    it('should print the game settings', () => {
      game.setSettings({ threshold: 10, asyncPlay: false, oGuessTime: 120, dGuessTime: 120, trackStats: false });
      const embedFields = gameSettingsEmbedFields(game);

      expect(embedFields).to.have.string('timer');
    });

    it('should not print timer if async is on', () => {
      game.setSettings({ threshold: 10, asyncPlay: true, oGuessTime: 120, dGuessTime: 120, trackStats: false });
      const embedFields = gameSettingsEmbedFields(game);

      expect(embedFields).to.not.have.string('timer');
    });
  });

  describe('clue', () => {
    let round: Round;
    beforeEach(() => {
      const team1 = new GameTeam();
      const team2 = new GameTeam();
      round = new Round(team1, team2);
      round.leftClue = 'foo';
      round.rightClue = 'bar';
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
    // xit('should update the game info', (done) => {
    //   updateGameInfo(message).then(() => {
    //     console.log('sendArgs: ', channelSendSpy.getCalls());
    //   }).then(done).catch(done);
    // });
  });
});