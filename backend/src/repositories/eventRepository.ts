import { RedisError } from '@/exceptions/customErrors';
import { IEventRepository } from '@/interfaces/repositories.interface';
import { RedisClientType } from 'redis';

export class EventRepository implements IEventRepository {
  constructor(private redisClient: RedisClientType) {}

  public async isEventProcessed(eventId: string, eventName: string): Promise<boolean> {
    try {
      const isEventExisted = await this.redisClient.zScore('processedEvents', `${eventName}:${eventId}`);
      this.removeOldEvents();

      return isEventExisted !== null;
    } catch (error) {
      throw new RedisError('Failed to check if event is processed', error);
    }
  }

  public async storeEvent(eventId: string, eventName: string): Promise<void> {
    try {
      const score = Math.floor(Date.now() / 1000); // Current timestamp in seconds

      await this.redisClient.zAdd('processedEvents', { score, value: `${eventName}:${eventId}` });
      this.removeOldEvents();
    } catch (error) {
      throw new RedisError('Failed to store event', error);
    }
  }

  public async removeOldEvents(): Promise<void> {
    try {
      const threshold = Math.floor(Date.now() / 1000) - 5 * 60; // 5 mins ago
      await this.redisClient.zRemRangeByScore('processedEvents', '-inf', threshold);
    } catch (error) {
      throw new RedisError('Failed to remove old events', error);
    }
  }

  public async processSocketEvent(event: string, eventId: string): Promise<boolean> {
    try {
      const iseventprocessed = await this.isEventProcessed(eventId, event);

      if (iseventprocessed) {
        console.log(`${event}:${eventId} has already processed.`);
        return true;
      } else {
        await this.storeEvent(eventId, event);
        return false;
      }
    } catch (error) {
      throw new RedisError('Failed to process socket event', error);
    }
  }
}
