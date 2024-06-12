import { RedisClientType } from 'redis';
import { UserRepository } from '../../src/repositories/userRepository';
import { RedisClient } from '../../src/redisClient';
import { REDIS_URL } from '../../src/config';

describe('UserRepository Unit Tests', () => {
  let userRepository: UserRepository;
  let redisClient: RedisClientType;
  const userId = 'testUser';

  beforeAll(() => {
    redisClient = RedisClient.getInstance(REDIS_URL!).getPubClient();
    userRepository = new UserRepository(redisClient);
  });

  afterAll(() => {
    redisClient.flushAll();
    redisClient.quit();
  });

  it('should set and check user status', async () => {
    await userRepository.setUserStatus(userId);
    const userStatus = await userRepository.checkUserStatus(userId);
    expect(userStatus).toEqual('in-chat');
  });

  it('should set and get last active time', async () => {
    const lastActiveTime = '2021-09-01T00:00:00.000Z';
    await userRepository.setLastActiveTimeBySocketId(userId, lastActiveTime);
    const fetchedTime = await userRepository.getLastActiveTimeBySocketId(userId);
    expect(fetchedTime).toEqual(lastActiveTime);
  });

  it('should delete last active time', async () => {
    await userRepository.deleteLastActiveTime(`user:${userId}:lastActivity`, userId);
    const fetchedTime = await userRepository.getLastActiveTimeBySocketId(userId);
    expect(fetchedTime).toBeNull();
  });
});
