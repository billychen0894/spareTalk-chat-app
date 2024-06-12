import { RedisClientType } from 'redis';
import { ChatRoomRepository } from '../../src/repositories/chatRoomRepository';
import { RedisClient } from '../../src/redisClient';
import { REDIS_URL } from '../../src/config';

describe('ChatRoomRepository Unit Tests', () => {
  let chatRoomRepository: ChatRoomRepository;
  let redisClient: RedisClientType;
  const roomId = 'testRoom';
  const user1 = 'user1';
  const user2 = 'user2';

  beforeAll(() => {
    redisClient = RedisClient.getInstance(REDIS_URL!).getPubClient();
    chatRoomRepository = new ChatRoomRepository(redisClient);
  });

  afterAll(() => {
    redisClient.flushAll();
    redisClient.quit();
  });

  it('should create and retrieve a chat room', async () => {
    await chatRoomRepository.createChatRoom(roomId, user1, user2);
    const room = await chatRoomRepository.getChatRoomById(roomId);

    expect(room).toEqual({
      id: roomId,
      state: 'occupied',
      participants: [user1, user2],
    });
  });

  it('should leave a chat room', async () => {
    await chatRoomRepository.leaveChatRoomById(roomId, user1);
    const room = await chatRoomRepository.getChatRoomById(roomId);

    expect(room).toEqual({
      id: roomId,
      state: 'idle',
      participants: [user2],
    });

    await chatRoomRepository.leaveChatRoomById(roomId, user2);
  });

  it('should get all chat rooms', async () => {
    const chatRooms = [
      { id: 'room1', state: 'occupied', participants: ['user1', 'user2'] },
      { id: 'room2', state: 'occupied', participants: ['user3', 'user4'] },
    ];

    for (const room of chatRooms) {
      await chatRoomRepository.createChatRoom(room.id, room.participants[0], room.participants[1]);
    }

    const allChatRooms = await chatRoomRepository.getAllChatRooms();

    expect(allChatRooms).toEqual(chatRooms);
  });

  it('should store and retrieve chat messages', async () => {
    const message = {
      id: 'message1',
      sender: user1,
      message: 'Hello, World!',
      timestamp: new Date().toISOString(),
    };

    await chatRoomRepository.storeMessage('room1', message);
    const messages = await chatRoomRepository.retrieveMessages('room1');

    expect(messages).toEqual([message]);
  });

  it('should delete chat room messages', async () => {
    await chatRoomRepository.leaveChatRoomById('room1', user1);
    await chatRoomRepository.deleteChatRoomMessagesById('room1');
    const messages = await chatRoomRepository.retrieveMessages('room1');
    expect(messages).toEqual([]);
  });

  it('should get missed messages', async () => {
    const message1 = {
      id: 'message1',
      sender: user1,
      message: 'Hello, World!',
      timestamp: new Date().toISOString(),
    };
    const message2 = {
      id: 'message2',
      sender: user2,
      message: 'Hi, there!',
      timestamp: new Date(Date.now() + 1000).toISOString(),
    };
    await chatRoomRepository.storeMessage('room2', message1);
    await chatRoomRepository.storeMessage('room2', message2);
    const missedMessages = await chatRoomRepository.getMissedMessages('room2', message1.timestamp);
    expect(missedMessages).toEqual([message2]);
  });

  it('should determine if a chat room is inactive', async () => {
    const key = 'chatRoom:room3:lastActivity';
    const thresholdInSeconds = 2 * 24 * 60 * 60; // two days;
    await chatRoomRepository.setChatRoomActivity('room3', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString());
    const result = await chatRoomRepository.isInactive(key, thresholdInSeconds);
    expect(result).toBe(true);
  });
});
