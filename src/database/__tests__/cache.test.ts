import { CACHE, cacheHasKey, getAndSetCacheData, getFromCache, invalidateCache, invalidateCacheKey, setToCache } from 'database/cache';

describe('Cache', () => {
  test('setToCache & getFromCache', () => {
    const key = 'set-to-cache-test';
    setToCache(key, 'data');
    expect(getFromCache(key)).toBe('data');
  });

  test('getAndSetCacheData', async () => {
    const key = 'get-and-set-cache-data-test';
    const data = await getAndSetCacheData(key, async () => {
      return 'data';
    });

    expect(getFromCache(key)).toBe(data);
  });

  test('invalidateCacheKey', () => {
    const key = 'invalidate-cache-key-test';
    setToCache(key, 'data');
    invalidateCacheKey(key);
    expect(cacheHasKey(key)).toBe(false);
  });

  test('invalidateCache', () => {
    const key = 'set-to-cache-test';
    setToCache(key, 'data');
    invalidateCache();
    expect([...CACHE.keys()].length).toBe(0);
  });
});
