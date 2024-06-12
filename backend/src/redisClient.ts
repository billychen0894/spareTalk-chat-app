import { RedisClientType, createClient } from 'redis';

export class RedisClient {
  private static instance: RedisClient;
  private pubClient: RedisClientType;
  private subClient: RedisClientType;

  private constructor(redisUrl: string) {
    this.pubClient = createClient({
      url: redisUrl,
    });
    this.subClient = this.pubClient.duplicate();

    this.pubClient.connect();
    this.subClient.connect();
    this.pubClient.on('error', err => console.error('Redis Client Error', err));
    this.pubClient.on('connect', () => console.log('Redis Client Connected'));
    this.pubClient.on('ready', () => console.log('Redis Client Ready'));
  }

  public static getInstance(redisUrl: string): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient(redisUrl);
    }

    return RedisClient.instance;
  }

  public getPubClient(): RedisClientType {
    return this.pubClient;
  }
  public getSubClient(): RedisClientType {
    return this.subClient;
  }
}
