import { RedisError } from '@/exceptions/customErrors';
import { IUserSessionRepository } from '@/interfaces/repositories.interface';
import { RedisClientType } from 'redis';

export class UserSessionRepository implements IUserSessionRepository {
  constructor(private redisClient: RedisClientType) {}

  public async storeUserSessionId(sessionId: string): Promise<void> {
    try {
      await this.redisClient.set(`user:${sessionId}:sessionId`, sessionId);
    } catch (error) {
      throw new RedisError('Failed to store user session ID', error);
    }
  }

  public async getUserSessionId(sessionId: string): Promise<string | null | undefined> {
    try {
      return await this.redisClient.get(`user:${sessionId}:sessionId`);
    } catch (error) {
      throw new RedisError('Failed to get user session ID', error);
    }
  }

  public async removeUserSessionId(sessionId: string): Promise<void> {
    try {
      await this.redisClient.del(`user:${sessionId}:sessionId`);
    } catch (error) {
      throw new RedisError('Failed to remove user session ID', error);
    }
  }
}
