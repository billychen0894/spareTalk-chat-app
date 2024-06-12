import { RedisError } from '@/exceptions/customErrors';
import { IUserQueueRepository } from '@/interfaces/repositories.interface';
import { RedisClientType } from 'redis';

export class UserQueueRepository implements IUserQueueRepository {
  constructor(private redisClient: RedisClientType) {}

  public async addUserToQueue(userId: string): Promise<void> {
    try {
      await this.redisClient.lPush('userQueue', userId);
      await this.redisClient.hSet('userStatus', userId, 'waiting');
    } catch (error) {
      throw new RedisError('Failed to add user to queue', error);
    }
  }

  public async removeUserAndCleanUp(userId: string): Promise<void> {
    try {
      await this.redisClient.lRem('userQueue', 0, userId);
      await this.redisClient.hDel('userStatus', userId);
    } catch (error) {
      throw new RedisError('Failed to remove user from queue', error);
    }
  }

  public async dequeueUser(): Promise<string | null> {
    try {
      return await this.redisClient.rPop('userQueue');
    } catch (error) {
      throw new RedisError('Failed to dequeue user', error);
    }
  }
}
