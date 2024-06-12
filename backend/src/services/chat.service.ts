import { HTTPException } from '@/exceptions/HttpException';
import { ChatMessage, ChatRoom } from '@/interfaces/sockets.interface';
import { ChatRoomRepository } from '@/repositories/chatRoomRepository';
import { EventRepository } from '@/repositories/eventRepository';
import { UserQueueRepository } from '@/repositories/userQueueRepository';
import { UserRepository } from '@/repositories/userRepository';
import { UserSessionRepository } from '@/repositories/userSessionRepository';
import { Service } from 'typedi';
import { v4 as uuidv4 } from 'uuid';
import { RedisClient } from '@/redisClient';
import { RedisError, ResourceNotFoundError } from '@/exceptions/customErrors';
import { REDIS_URL } from '@/config';

@Service()
export class ChatService {
  private chatRoomRepository: ChatRoomRepository;
  private userQueueRepository: UserQueueRepository;
  private userRepository: UserRepository;
  private userSessionRepository: UserSessionRepository;
  private eventRepository: EventRepository;
  private redisClient = RedisClient.getInstance(REDIS_URL!).getPubClient();

  constructor() {
    this.chatRoomRepository = new ChatRoomRepository(this.redisClient);
    this.userQueueRepository = new UserQueueRepository(this.redisClient);
    this.userRepository = new UserRepository(this.redisClient);
    this.userSessionRepository = new UserSessionRepository(this.redisClient);
    this.eventRepository = new EventRepository(this.redisClient);
  }

  public async startChat(
    userId: string,
    sessionId: string | undefined,
    chatRoomId: string | undefined,
    eventId: string,
  ): Promise<{ status: string; data: ChatRoom | null }> {
    try {
      const isEventProcessed = await this.eventRepository.processSocketEvent('start-chat', eventId);

      if (isEventProcessed) {
        return { status: 'event processed', data: null };
      }

      if (sessionId && chatRoomId) {
        const userStatus = await this.userRepository.checkUserStatus(sessionId);
        const chatRoom = await this.chatRoomRepository.getChatRoomById(chatRoomId);

        if (chatRoom && userStatus === 'in-chat' && chatRoom?.participants.includes(sessionId)) {
          return { status: 'in-chat', data: chatRoom };
        }
      }

      await this.userQueueRepository.addUserToQueue(userId);
      const chatRoom = await this.pairUsers();

      if (chatRoom) {
        return { status: 'chat room created', data: chatRoom };
      } else {
        return { status: 'waiting for user', data: null };
      }
    } catch (error) {
      if (error instanceof ResourceNotFoundError || error instanceof RedisError) {
        throw error;
      }
      console.error('Failed to start chat:', error);
      throw new Error('Failed to start chat');
    }
  }

  public async sendMessage(chatRoomId: string, chatMessage: ChatMessage, eventId: string): Promise<{ status: string; data: ChatMessage | null }> {
    try {
      const isEventProcessed = await this.eventRepository.processSocketEvent('send-message', eventId);

      if (isEventProcessed) {
        return { status: 'event processed', data: null };
      }

      await this.chatRoomRepository.storeMessage(chatRoomId, chatMessage);
      return { status: 'message sent', data: chatMessage };
    } catch (error) {
      if (error instanceof RedisError) {
        throw error;
      }
      console.error('Failed to send message:', error);
      throw new Error('Failed to send message');
    }
  }

  public async leaveChatRoom(
    chatRoomId: string | undefined,
    sessionId: string | undefined,
    eventId: string,
  ): Promise<{ status: string; data: null }> {
    try {
      const isEventProcessed = await this.eventRepository.processSocketEvent('leave-chat', eventId);

      if (isEventProcessed) {
        return { status: 'event processed', data: null };
      }

      if (sessionId && chatRoomId) {
        await this.clearUser(sessionId, chatRoomId);
        return { status: 'left chat room', data: null };
      }

      return { status: 'no chat room', data: null };
    } catch (error) {
      if (error instanceof RedisError) {
        throw error;
      }

      console.error('Failed to leave chat room:', error);
      throw new Error('Failed to leave chat room');
    }
  }

  public async retrieveChatMessages(chatRoomId: string, eventId: string): Promise<{ status: string; data: ChatMessage[] | null }> {
    try {
      const isEventProcessed = await this.eventRepository.processSocketEvent('retrieve-chat-messages', eventId);

      if (isEventProcessed) {
        return { status: 'event processed', data: null };
      }

      const messages = await this.chatRoomRepository.retrieveMessages(chatRoomId);

      if (messages) {
        return { status: 'messages retrieved', data: messages };
      }

      return { status: 'no messages', data: null };
    } catch (error) {
      if (error instanceof ResourceNotFoundError || error instanceof RedisError) {
        throw error;
      }

      console.error('Failed to retrieve chat messages', error);
      throw new Error('Failed to retrieve chat messages');
    }
  }

  public async disconnect(sessionId: string | undefined): Promise<{ status: string } | undefined> {
    try {
      if (!sessionId) return { status: 'no session' };

      const userStatus = await this.userRepository.checkUserStatus(sessionId);

      if (userStatus === 'waiting') {
        await Promise.all([this.userQueueRepository.removeUserAndCleanUp(sessionId), this.userSessionRepository.removeUserSessionId(sessionId)]);
        return { status: 'ok' };
      }

      if (userStatus === 'in-chat') {
        const lastActiveTime = new Date().toISOString();
        await this.userRepository.setLastActiveTimeBySocketId(sessionId, lastActiveTime);
        return { status: 'ok' };
      }
    } catch (error) {
      if (error instanceof ResourceNotFoundError || error instanceof RedisError) {
        throw error;
      }

      console.error('Failed to disconnect chat', error);
      throw new Error('Failed to disconnect chat');
    }
  }

  public async checkChatRoomSession(chatRoomId: string, sessionId: string, eventId: string): Promise<{ status: string; data: ChatRoom | null }> {
    try {
      const isEventProcessed = await this.eventRepository.processSocketEvent('check-chatRoom-session', eventId);

      if (isEventProcessed) {
        return { status: 'event processed', data: null };
      }

      const chatRoom = await this.chatRoomRepository.getChatRoomById(chatRoomId);

      if (chatRoom && chatRoom.participants.includes(sessionId)) {
        return { status: 'ok', data: chatRoom };
      } else {
        this.userSessionRepository.removeUserSessionId(sessionId);
        return { status: 'no session', data: null };
      }
    } catch (error) {
      if (error instanceof ResourceNotFoundError || error instanceof RedisError) {
        throw error;
      }

      console.error('Failed to check chat room session', error);
      throw new Error('Failed to check chat room session');
    }
  }

  public async pairUsers(): Promise<ChatRoom | null> {
    try {
      const user1 = await this.userQueueRepository.dequeueUser();
      const user2 = await this.userQueueRepository.dequeueUser();

      if (user1 && user2) {
        const chatRoomId = uuidv4();

        await this.chatRoomRepository.createChatRoom(chatRoomId, user1, user2);
        await this.userRepository.setUserStatus(user1);
        await this.userRepository.setUserStatus(user2);

        // Set initial chat room activity at creation
        const currentTime = new Date().toISOString();
        await this.chatRoomRepository.setChatRoomActivity(chatRoomId, currentTime);

        return { id: chatRoomId, state: 'occupied', participants: [user1, user2] };
      } else {
        if (user1) await this.userQueueRepository.addUserToQueue(user1);
        if (user2) await this.userQueueRepository.addUserToQueue(user2);

        return null;
      }
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }

      console.error('Failed to pair users', error);
      throw new Error('Failed to pair users');
    }
  }

  public async clearUser(sessionId: string, chatRoomId: string): Promise<void> {
    try {
      await Promise.all([
        this.userRepository.removeUserMessageIds(sessionId, chatRoomId),
        this.chatRoomRepository.leaveChatRoomById(chatRoomId, sessionId),
        this.chatRoomRepository.deleteChatRoomMessagesById(chatRoomId),
        this.userRepository.deleteUserRelatedKeys(sessionId),
        this.chatRoomRepository.deleteChatRoomRelatedKeys(chatRoomId),
      ]);
    } catch (error) {
      if (error instanceof RedisError) {
        throw error;
      }
      console.error('Error clearing user data:', error);
      throw new Error('Failed to clear user data');
    }
  }

  public async findChatRoomById(chatRoomId: string): Promise<ChatRoom> {
    try {
      const chatRoom = await this.chatRoomRepository.getChatRoomById(chatRoomId);
      if (!chatRoom) throw new HTTPException(409, "Chat room doesn't exist");

      return chatRoom;
    } catch (error) {
      if (error instanceof ResourceNotFoundError || HTTPException) {
        throw error;
      }

      console.error('Failed to find chat room:', error);
      throw new Error('Failed to find chat room');
    }
  }

  public async recoverChatRoomMessages(sessionId: string, chatRoomId: string): Promise<ChatMessage[] | null | undefined> {
    try {
      const lastActiveTime = await this.userRepository.getLastActiveTimeBySocketId(sessionId);
      const missedMessages = await this.chatRoomRepository.getMissedMessages(chatRoomId, lastActiveTime);

      return missedMessages;
    } catch (error) {
      if (error instanceof RedisError || ResourceNotFoundError) {
        throw error;
      }

      console.error('Failed to recover chat room messages:', error);
      throw new Error('Failed to recover chat room messages');
    }
  }

  public async checkUserSession(sessionId: string): Promise<string | null | undefined> {
    try {
      const userSessionId = await this.userSessionRepository.getUserSessionId(sessionId);
      return userSessionId;
    } catch (error) {
      if (error instanceof RedisError) {
        throw error;
      }

      console.error('Failed to check user session:', error);
      throw new Error('Failed to check user session');
    }
  }

  public async storeUserSession(sessionId: string): Promise<void> {
    try {
      await this.userSessionRepository.storeUserSessionId(sessionId);
    } catch (error) {
      if (error instanceof RedisError) {
        throw error;
      }

      console.error('Failed to store user session:', error);
      throw new Error('Failed to store user session');
    }
  }

  public async checkInactiveChatRooms(): Promise<ChatRoom[]> {
    try {
      const chatRooms = await this.chatRoomRepository.getAllChatRooms();
      const inActiveChatRooms: ChatRoom[] = [];

      if (chatRooms && chatRooms?.length > 0) {
        for (const chatRoom of chatRooms) {
          const thresholdInSeconds = 2 * 24 * 60 * 60; // two days;
          const isInactive = await this.chatRoomRepository.isInactive(`chatRoom:${chatRoom?.id}:lastActivity`, thresholdInSeconds);

          if (isInactive) {
            chatRoom.participants.forEach(async participant => {
              const userSessionId = await this.userSessionRepository.getUserSessionId(participant);

              if (userSessionId) {
                await this.clearUser(userSessionId, chatRoom?.id);
              }
            });

            inActiveChatRooms.push(chatRoom);
          }
        }
      }

      return inActiveChatRooms;
    } catch (error) {
      if (error instanceof RedisError || ResourceNotFoundError) {
        throw error;
      }

      console.error('Failed to check inactive chat rooms:', error);
      throw new Error('Failed to check inactive chat rooms');
    }
  }
}
