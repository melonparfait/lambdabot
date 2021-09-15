import { InteractionType } from 'discord-api-types';
import { Channel, Client, CommandInteraction, CommandInteractionOptionResolver, DMChannel, Intents, Message, TextBasedChannel, TextBasedChannels, TextChannel, User } from 'discord.js';
import _ from 'lodash';
import * as sinon from 'sinon';
import { anyString, anything, instance, mock, reset, resetCalls, when } from 'ts-mockito';

export enum CommandArgType {
  boolean, integer, string, number
}

export class MockInteraction {
  mockedInteraction: CommandInteraction;
  interactionInstance: CommandInteraction;

  mockChannel: TextBasedChannels;
  channelInstance: TextBasedChannels;

  mockUser: User;
  userInstance: User;

  mockMessage: Message;
  messageInstance: Message;

  reply: sinon.SinonStub;
  channelSend: sinon.SinonStub;
  messagePin: sinon.SinonStub;

  mockOptions: CommandInteractionOptionResolver;
  optionInstance: CommandInteractionOptionResolver;

  constructor(public userId: string, public channelId: string) {
    this.initMockInteraction();
    this.initMockChannel();
    this.initMockUser();
    this.initMockOptions();
  }

  private initMockInteraction() {
    this.mockedInteraction = mock(CommandInteraction);
    this.interactionInstance = instance(this.mockedInteraction);

    when(this.mockedInteraction.channelId).thenReturn(this.channelId);

    this.reply = sinon.stub().resolves(true);
    when(this.mockedInteraction.reply(anything())).thenCall((arg: {
      content: string,
      ephemeral: boolean
    }) => this.reply(arg));
  }

  private initMockChannel() {
    this.mockChannel = mock(TextBasedChannel);
    this.channelInstance = instance(this.mockChannel);
    when(this.mockChannel.id).thenReturn(this.channelId);
    when(this.mockChannel.send(anything())).thenCall((arg: {
      content: string,
      ephemeral: boolean
    }) => this.channelSend(arg));

    this.messagePin = sinon.stub().resolves(true);
    this.mockMessage = mock(Message);
    this.messageInstance = instance(this.mockMessage);
    this.channelSend = sinon.stub().resolves({
      pin: this.messagePin
    });

    when(this.mockedInteraction.channel).thenReturn(this.channelInstance);
  }

  private initMockUser() {
    this.mockUser = mock(User);
    this.userInstance = instance(this.mockUser);
    when(this.mockUser.id).thenReturn(this.userId);
    when(this.mockedInteraction.user).thenReturn(this.userInstance);
  }

  private initMockOptions() {
    this.mockOptions = mock(CommandInteractionOptionResolver);
    this.optionInstance = instance(this.mockOptions);
    when(this.mockedInteraction.options).thenReturn(this.optionInstance);
  }

  setInteractionInput(type: 'string' | 'boolean' | 'number' | 'integer',
      name: string,
      value: string | boolean | number) {
    switch (type) {
      case 'string':
        when(this.mockOptions.getString(name)).thenReturn(value as string);
        when(this.mockOptions.getString(name, true)).thenReturn(value as string);
        when(this.mockOptions.getString(name, false)).thenReturn(value as string);
        break;
      case 'boolean':
        when(this.mockOptions.getBoolean(name)).thenReturn(value as boolean);
        when(this.mockOptions.getBoolean(name, true)).thenReturn(value as boolean);
        when(this.mockOptions.getBoolean(name, false)).thenReturn(value as boolean);
        break;
      case 'integer':
        when(this.mockOptions.getInteger(name)).thenReturn(value as number);
        when(this.mockOptions.getInteger(name, true)).thenReturn(value as number);
        when(this.mockOptions.getInteger(name, false)).thenReturn(value as number);
        break;
      case 'number':
        when(this.mockOptions.getNumber(name)).thenReturn(value as number);
        when(this.mockOptions.getNumber(name, true)).thenReturn(value as number);
        when(this.mockOptions.getNumber(name, false)).thenReturn(value as number);
        break;
      default:
        throw new Error('Incorrect arguments');
    }
  }

  resetMock() {
    reset(this.mockedInteraction);
    this.initMockInteraction();
    this.initMockChannel();
    this.initMockUser();
  }

  resetCalls() {
    resetCalls(this.mockedInteraction);
  }
}