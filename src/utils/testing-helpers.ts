import { InteractionType } from 'discord-api-types';
import { Channel, Client, Collection, CommandInteraction, CommandInteractionOptionResolver, DMChannel, Intents, Message, TextBasedChannel, TextBasedChannels, TextChannel, User, UserManager } from 'discord.js';
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

  mockUser: MockUser;
  userInstance: User;

  mockMessage: Message;
  messageInstance: Message;

  reply: sinon.SinonStub;
  channelSend: sinon.SinonStub;
  messagePin: sinon.SinonStub;
  messageUnpin: sinon.SinonStub;
  editPinnedMsg: sinon.SinonStub;

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
    when(this.mockChannel.send(anything())).thenCall(arg => this.channelSend(arg));

    this.messagePin = sinon.stub().resolves(this.messageInstance);
    this.messageUnpin = sinon.stub().resolves(this.messageInstance);
    this.editPinnedMsg = sinon.stub().resolves(this.messageInstance);
    this.mockMessage = mock(Message);
    this.messageInstance = instance(this.mockMessage);
    when(this.mockMessage.edit(anything())).thenCall(arg => this.editPinnedMsg(arg));
    when(this.mockMessage.unpin()).thenCall(() => this.messageUnpin());

    this.channelSend = sinon.stub().resolves({
      pin: this.messagePin,
      unpin: this.messageUnpin
    });

    when(this.mockedInteraction.channel).thenReturn(this.channelInstance);
  }

  private initMockUser() {
    this.mockUser = new MockUser(this.userId);
    this.userInstance = this.mockUser.userInstance;
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
    reset(this.mockChannel);
    reset(this.mockMessage);
    reset(this.mockOptions);
    reset(this.mockUser);
    this.initMockInteraction();
    this.initMockChannel();
    this.initMockUser();
  }

  resetCalls() {
    this.reply.resetHistory();
    this.channelSend.resetHistory();
    this.messagePin.resetHistory();
    this.messageUnpin.resetHistory();
    this.editPinnedMsg.resetHistory();
    resetCalls(this.mockedInteraction);
    resetCalls(this.mockChannel);
    resetCalls(this.mockMessage);
    resetCalls(this.mockOptions);
    resetCalls(this.mockUser);
  }

  clearMocks() {
    reset(this.mockedInteraction);
    reset(this.mockChannel);
    reset(this.mockMessage);
    reset(this.mockOptions);
    reset(this.mockUser);
  }
}

export class MockUserManager {
  mockedUserManager: UserManager;
  userManagerInstance: UserManager;

  userCache: Collection<string, User>;
  mockUserCache: Collection<string, MockUser>;

  constructor(public usersInCache: MockUser[]) {
    this.initUser();
  }

  initUser() {
    this.userCache = new Collection<string, User>();
    this.mockUserCache = new Collection<string, MockUser>();
    this.usersInCache.forEach(mockUser => {
      this.userCache.set(mockUser.userId, mockUser.userInstance);
      this.mockUserCache.set(mockUser.userId, mockUser);
    })
    this.mockedUserManager = mock(UserManager);
    this.userManagerInstance = instance(this.mockedUserManager);
    when(this.mockedUserManager.cache).thenReturn(this.userCache);
  }

  addUserToCache(mockUsers: MockUser[]) {
    mockUsers.forEach(user => {
      this.userCache.set(user.userId, user.userInstance);
      this.mockUserCache.set(user.userId, user);
    });
  }

  getMockUserFromCache(userId: string) {
    return this.mockUserCache.get(userId);
  }

  removeUserFromCache(userId: string) {
    this.userCache.delete(userId);
    this.mockUserCache.delete(userId);
  }

  clearCache() {
    this.userCache.clear();
    this.mockUserCache.clear();
  }

  resetMock() {
    reset(this.mockedUserManager);
    this.initUser();
  }

  resetCalls() {
    resetCalls(this.mockedUserManager);
  }

  clearMocks() {
    this.clearCache();
    reset(this.mockedUserManager);
  }
}

export class MockUser {
  mockUser: User;
  userInstance: User;

  send: sinon.SinonStub;

  constructor(public userId: string) {
    this.initUser();
  }

  initUser() {
    this.send = sinon.stub();
    this.mockUser = mock(User);
    this.userInstance = instance(this.mockUser);
    when(this.mockUser.id).thenReturn(this.userId);
    when(this.mockUser.tag).thenReturn(this.userId);
    when(this.mockUser.send(anything())).thenCall(args => this.send(args))
      .thenReturn(Promise.resolve(undefined));
  }

  resetMock() {
    reset(this.mockUser);
    this.initUser();
  }

  resetCalls() {
    this.send.resetHistory
    resetCalls(this.mockUser);
  }

  clearMocks() {
    reset(this.mockUser);
  }
}