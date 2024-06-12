import { RedisClientType } from 'redis';
import { RedisClient } from '../../src/redisClient';
import { REDIS_URL } from '../../src/config';
import { UserSessionRepository } from '../../src/repositories/userSessionRepository';

describe('UserSessionRepository Unit Tests', () => {
  let userSessionRepository: UserSessionRepository;
  let redisClient: RedisClientType;
  const sessionId = 'testSession';

  beforeAll(() => {
    redisClient = RedisClient.getInstance(REDIS_URL!).getPubClient();
    userSessionRepository = new UserSessionRepository(redisClient);
  });

  afterAll(() => {
    redisClient.flushAll();
    redisClient.quit();
  });

  it('should store and retrieve a user session ID', async () => {
    await userSessionRepository.storeUserSessionId(sessionId);
    const session = await userSessionRepository.getUserSessionId(sessionId);
    expect(session).toEqual(sessionId);
  });

  it('should remove a user session ID', async () => {
    await userSessionRepository.removeUserSessionId(sessionId);
    const session = await userSessionRepository.getUserSessionId(sessionId);
    expect(session).toBeNull();
  });
});
