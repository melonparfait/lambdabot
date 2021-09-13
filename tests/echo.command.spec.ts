import { expect } from 'chai';
import * as EchoCommand from '../src/commands/echo.new.command';
import { CommandArgType, MockInteraction } from '../src/utils/testing-helpers';
import * as chai from 'chai';
import { SinonStub } from 'sinon';

describe('echo command', () => {
  chai.use(require('sinon-chai'));
  let interaction: MockInteraction;
  let command: any;
  beforeEach(() => {
    command = EchoCommand;
  });

  it('should create', () => {
    expect(command).to.be.ok;
  });

  describe('when a user types in input', () => {
    beforeEach(async () => {
      interaction = new MockInteraction('12345', '12345');
      (interaction.reply as SinonStub).resetHistory();
      interaction.registerArg(CommandArgType.string, 'input', 'hello world');
      await command.execute(interaction);
    });

    it('should return the interaction\'s content', () => {
      expect(interaction.reply).to.have.been.calledOnceWith('hello world');
    });
  });
});