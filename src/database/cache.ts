export const CACHE = new Map<string, unknown>([]);

export const setToCache = <TData>(key: string, data: TData) => {
  CACHE.set(key, data);
};

export const getFromCache = <TData>(key: string): TData | undefined => {
  return CACHE.get(key) as TData | undefined;
};

export const getAndSetCacheData = async <TData>(key: string, updater: () => Promise<TData>): Promise<TData> => {
  if (CACHE.has(key)) {
    return CACHE.get(key) as TData;
  }
  const data: TData = await updater();
  setToCache<TData>(key, data);
  return data;
};

export const invalidateCache = (): void => {
  CACHE.clear();
};

export const invalidateCacheKey = (key: string): void => {
  CACHE.delete(key);
};
