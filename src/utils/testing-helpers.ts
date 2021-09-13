import { InteractionType } from 'discord-api-types';
import { Channel, Client, CommandInteraction, CommandInteractionOptionResolver, DMChannel, Intents, Message, TextBasedChannel, TextBasedChannels, TextChannel, User } from 'discord.js';
import _ from 'lodash';
import Sinon, { SinonStub } from 'sinon';
import { anything, instance, mock, when } from 'ts-mockito';

export enum CommandArgType {
  boolean, integer, string, number
}

export class MockInteraction {
  sinon: any;

  mockedInteraction: CommandInteraction;
  interactionInstance: CommandInteraction;

  mockChannel: TextBasedChannels;
  channelInstance: TextBasedChannels;

  mockUser: User;
  userInstance: User;

  mockMessage: Message;
  messageInstance: Message;

  reply: SinonStub;
  channelSend: SinonStub;
  messagePin: SinonStub;

  constructor(public userId: string, public channelId: string) {
    this.sinon = require('sinon');
    this.initMockInteraction();
    this.initMockChannel();
    this.initMockUser();
  }

  private initMockInteraction() {
    this.mockedInteraction = mock(CommandInteraction);
    this.interactionInstance = instance(this.mockedInteraction);

    when(this.mockedInteraction.channelId).thenReturn(this.channelId);

    this.reply = (this.sinon.stub() as SinonStub).resolves(true);
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

    this.messagePin = (this.sinon.stub() as SinonStub).resolves(true);
    this.mockMessage = mock(Message);
    this.messageInstance = instance(this.mockMessage);
    this.channelSend = (this.sinon.stub() as SinonStub).resolves({
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
}