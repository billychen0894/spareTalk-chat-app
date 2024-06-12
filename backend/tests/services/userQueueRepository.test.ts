import { RedisClientType } from 'redis';
import { UserQueueRepository } from '../../src/repositories/userQueueRepository';
import { RedisClient } from '../../src/redisClient';
import { REDIS_URL } from '../../src/config';

describe('UserQueueRepository Unit Tests', () => {
  let userQueueRepository: UserQueueRepository;
  let redisClient: RedisClientType;
  const userId = 'testUser';

  beforeAll(() => {
    redisClient = RedisClient.getInstance(REDIS_URL!).getPubClient();
    userQueueRepository = new UserQueueRepository(redisClient);
  });

  afterAll(() => {
    redisClient.flushAll();
    redisClient.quit();
  });

  it('should add and remove a user from the queue', async () => {
    await userQueueRepository.addUserToQueue(userId);
    const user = await userQueueRepository.dequeueUser();
    expect(user).toEqual(userId);
  });

  it('should remove a user from the queue', async () => {
    await userQueueRepository.addUserToQueue(userId);
    await userQueueRepository.removeUserAndCleanUp(userId);
    const user = await userQueueRepository.dequeueUser();
    expect(user).toBeNull();
  });
});
