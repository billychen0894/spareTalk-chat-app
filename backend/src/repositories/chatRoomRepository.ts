import { RedisError, ResourceNotFoundError } from '@/exceptions/customErrors';
import { IChatRoomRepository } from '@/interfaces/repositories.interface';
import { ChatMessage, ChatRoom } from '@/interfaces/sockets.interface';
import { RedisClientType } from 'redis';

export class ChatRoomRepository implements IChatRoomRepository {
  constructor(private redisClient: RedisClientType) {}

  public async createChatRoom(roomId: string, user1: string, user2: string): Promise<void> {
    try {
      const result = await this.redisClient.hSet(
        'chatRooms',
        roomId,
        JSON.stringify({ id: roomId, state: 'occupied', participants: [user1, user2] }),
      );

      if (!result) {
        throw new RedisError('Failed to create chat room', { id: roomId, participants: [user1, user2] });
      }
    } catch (error) {
      if (error instanceof RedisError) {
        throw error;
      }
      throw new Error('Something went wrong while creating chat room');
    }
  }

  public async leaveChatRoomById(roomId: string, socketId: string): Promise<void> {
    try {
      const roomData = await this.redisClient.hGet('chatRooms', roomId);

      if (!roomData) {
        throw new ResourceNotFoundError('Chat room not found');
      }

      const roomObj = JSON.parse(roomData) as ChatRoom;
      const socketIdIndex = roomObj.participants.indexOf(socketId);

      if (socketIdIndex > -1) {
        roomObj.participants.splice(socketIdIndex, 1);
        roomObj.state = 'idle';
        await this.redisClient.hDel('userStatus', socketId);

        const updatedRoomData = JSON.stringify(roomObj);
        await this.redisClient.hSet('chatRooms', roomId, updatedRoomData);
      }

      if (roomObj.participants.length === 0) {
        await this.redisClient.hDel('chatRooms', roomId);
      }
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }

      throw new RedisError('Failed to leave chat room', error);
    }
  }

  public async getChatRoomById(chatRoomId: string): Promise<ChatRoom | undefined | null> {
    try {
      const chatRoom = await this.redisClient.hGet('chatRooms', chatRoomId);

      if (!chatRoom) {
        throw new ResourceNotFoundError('Chat room not found', { chatRoomId });
      }

      return JSON.parse(chatRoom);
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }

      throw new RedisError('Failed to get chat room', error);
    }
  }

  public async getAllChatRooms(): Promise<ChatRoom[] | undefined | null> {
    try {
      const chatRoomsObj = await this.redisClient.hVals('chatRooms');

      if (!chatRoomsObj) {
        throw new ResourceNotFoundError('Chat rooms not found');
      }

      return chatRoomsObj.map(chatRoom => JSON.parse(chatRoom)) as ChatRoom[];
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }

      throw new RedisError('Failed to get chat rooms', error);
    }
  }

  public async storeMessage(chatRoomId: string, chatMessage: ChatMessage): Promise<void> {
    try {
      const isMessageExisted = await this.redisClient.sIsMember('chatMessageIds', chatMessage?.id);

      if (!isMessageExisted) {
        const key = `chatRoom:${chatRoomId}:messages`;
        await this.redisClient.sAdd('chatMessageIds', chatMessage?.id);
        await this.redisClient.rPush(key, JSON.stringify(chatMessage));

        // Limit number of messages
        const limit = 10000;
        const chatMessagesLength = await this.redisClient.lLen(key);

        if (chatMessagesLength > limit) {
          // Keeps most recent 10000 messages
          await this.redisClient.lTrim(key, -limit, -1);
        }

        // set last activity on user actions in chatRoom for tracking inactivity
        const currentTime = new Date().toISOString();
        await this.redisClient.set(`user:${chatMessage?.sender}:lastActivity`, currentTime);
        await this.redisClient.set(`chatRoom:${chatRoomId}:lastActivity`, currentTime);
      }
    } catch (error) {
      throw new RedisError('Failed to store message', error);
    }
  }

  public async retrieveMessages(chatRoomId: string): Promise<ChatMessage[] | null | undefined> {
    try {
      const key = `chatRoom:${chatRoomId}:messages`;
      const result = await this.redisClient.lRange(key, 0, -1);

      if (!result) {
        throw new ResourceNotFoundError('Chat messages not found');
      }

      return result.map(element => JSON.parse(element)) as ChatMessage[];
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }

      throw new RedisError('Failed to retrieve messages', error);
    }
  }

  public async deleteChatRoomMessagesById(chatRoomId: string): Promise<void> {
    try {
      const chatRoom = await this.getChatRoomById(chatRoomId);

      if (!chatRoom) {
        throw new ResourceNotFoundError('Chat room not found', { chatRoomId });
      }

      if (chatRoom.participants.length === 1) {
        const key = `chatRoom:${chatRoomId}:messages`;
        await this.redisClient.DEL(key);
      }
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }

      throw new RedisError('Failed to delete chat room messages', error);
    }
  }

  public async getMissedMessages(chatRoomId: string, lastActiveTime: string | null | undefined): Promise<ChatMessage[] | null | undefined> {
    try {
      if (!lastActiveTime) {
        throw new Error('No last active time provided');
      }

      const key = `chatRoom:${chatRoomId}:messages`;
      const result = await this.redisClient.lRange(key, 0, -1);

      if (!result) {
        throw new ResourceNotFoundError('Chat messages not found');
      }

      const chatMessages = result.map(element => JSON.parse(element)) as ChatMessage[];

      return chatMessages.filter(chatMessages => new Date(chatMessages.timestamp) > new Date(lastActiveTime));
    } catch (error) {
      if (error instanceof ResourceNotFoundError || error instanceof Error) {
        throw error;
      }

      throw new RedisError('Failed to get missed messages', error);
    }
  }

  public async isInactive(key: string, thresholdInSeconds: number): Promise<boolean> {
    try {
      const lastActiveString = await this.redisClient.get(key);

      if (!lastActiveString) {
        throw new ResourceNotFoundError('Last active time not found');
      }

      const lastActiveTime = new Date(lastActiveString).getTime();
      const now = new Date().getTime();
      const differenceInSeconds = (now - lastActiveTime) / 1000;
      return differenceInSeconds > thresholdInSeconds;
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }

      throw new RedisError('Failed to check inactivity', error);
    }
  }

  public async setChatRoomActivity(chatRoomId: string, timestamp: string): Promise<void> {
    try {
      await this.redisClient.set(`chatRoom:${chatRoomId}:lastActivity`, timestamp);
    } catch (error) {
      throw new RedisError('Failed to set chat room activity', error);
    }
  }

  public async deleteChatRoomRelatedKeys(chatRoomId: string): Promise<void> {
    try {
      const chatRoomKey = `chatRoom:${chatRoomId}:lastActivity`;
      await this.redisClient.del(chatRoomKey);
    } catch (error) {
      throw new RedisError('Failed to delete chat room related keys', error);
    }
  }
}
