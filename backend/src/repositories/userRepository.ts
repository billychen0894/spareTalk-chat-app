import { RedisError, ResourceNotFoundError } from '@/exceptions/customErrors';
import { IUserRepository } from '@/interfaces/repositories.interface';
import { ChatMessage } from '@/interfaces/sockets.interface';
import { RedisClientType } from 'redis';

export class UserRepository implements IUserRepository {
  constructor(private redisClient: RedisClientType) {}

  public async checkUserStatus(sessionId: string): Promise<string | null> {
    try {
      const userStatus = await this.redisClient.hGet('userStatus', sessionId);

      return userStatus ? userStatus : null;
    } catch (error) {
      throw new RedisError('Failed to check user status', error);
    }
  }

  public async setUserStatus(user: string): Promise<void> {
    try {
      this.redisClient.hSet('userStatus', user, 'in-chat');
    } catch (error) {
      throw new RedisError('Failed to set user status', error);
    }
  }

  public async setLastActiveTimeBySocketId(socketId: string, lastActiveTime: string): Promise<void> {
    try {
      await this.redisClient.set(`user:${socketId}:lastActivity`, lastActiveTime);
    } catch (error) {
      throw new RedisError('Failed to set last active time', error);
    }
  }

  public async getLastActiveTimeBySocketId(socketId: string): Promise<string | null | undefined> {
    try {
      const lastActiveTime = await this.redisClient.get(`user:${socketId}:lastActivity`);

      return lastActiveTime ? lastActiveTime : null;
    } catch (error) {
      throw new RedisError('Failed to get last active time', error);
    }
  }

  public async deleteLastActiveTime(key: string, socketId: string): Promise<void> {
    try {
      if (socketId) {
        await this.redisClient.DEL(key);
      }
    } catch (error) {
      throw new RedisError('Failed to delete last active time', error);
    }
  }

  public async removeUserMessageIds(socketId: string, chatRoomId: string): Promise<void> {
    try {
      // Fetch all message IDs from the chat room
      const key = `chatRoom:${chatRoomId}:messages`;
      const messageStrings = await this.redisClient.lRange(key, 0, -1);

      if (!messageStrings) {
        throw new ResourceNotFoundError('Chat messages not found');
      }

      const messages = messageStrings.map(msg => JSON.parse(msg)) as ChatMessage[];

      // Filter out messages sent by the user
      const userMessageIds = messages.filter(msg => msg.sender === socketId).map(msg => msg.id);

      // Remove each of the user's message IDs from the chatMessageIds set
      for (const messageId of userMessageIds) {
        await this.redisClient.sRem('chatMessageIds', messageId);
      }
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }

      throw new RedisError('Failed to remove user message IDs', error);
    }
  }

  public async deleteUserRelatedKeys(sessionId: string): Promise<void> {
    try {
      const userKey = `user:${sessionId}:lastActivity`;
      const userSessionKey = `user:${sessionId}:sessionId`;
      await Promise.all([this.redisClient.del(userKey), this.redisClient.del(userSessionKey)]);
    } catch (error) {
      throw new RedisError('Failed to delete user related keys', error);
    }
  }
}
