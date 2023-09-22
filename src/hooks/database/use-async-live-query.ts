import { useLiveQuery } from 'dexie-react-hooks';
import { CryliteDatabase, database } from 'database/database';
import { CACHE, getAndSetCacheData, getFromCache } from 'database/cache';

enum Status {
  PENDING = 'pending',
  RESOLVED = 'resolved'
}

enum CacheStatus {
  CACHED = 'cached',
  FRESH = 'fresh'
}

export type UseAsyncLiveQueryParams<TData, TDefault> = {
  queryFn: (database: CryliteDatabase) => Promise<TData>;
  deps?: unknown[];
  fallback?: TDefault,
  cacheKey?: string;
  enabled?: boolean;
};

type UseAsyncLiveQueryStates =
  | 'isSuccess'
  | 'isCached'
  | 'isFresh'
  | 'isLoading';

export type UseAsyncLiveQueryReturn<T> = {
  status: Status;
  cacheStatus: CacheStatus;
  data: T;
} & Record<UseAsyncLiveQueryStates, boolean>;

export const useAsyncLiveQuery = <TData, TDefault = TData>(
  params: UseAsyncLiveQueryParams<TData, TDefault>
): UseAsyncLiveQueryReturn<TData | TDefault> => {
  const {
    queryFn,
    deps = [],
    fallback,
    cacheKey,
    enabled = true
  } = params;

  const cachedData = cacheKey && CACHE.has(cacheKey) ? getFromCache<TData>(cacheKey) : null;
  const cacheExists = cachedData !== null;

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const [data, status, cacheStatus] = useLiveQuery<[TData, Status, CacheStatus], [TDefault, Status, CacheStatus]>(() => {
    if (!enabled) {
      return [fallback, Status.PENDING, CacheStatus.FRESH];
    }
    if (cacheExists) {
      return [cachedData, Status.RESOLVED, CacheStatus.CACHED];
    }

    const updater = cacheKey ? getAndSetCacheData<TData>(cacheKey, async () => queryFn(database)) : queryFn(database);

    return updater.then((queryData: TData) => {
      const d = queryData === undefined ? fallback : queryData;
      return [d, Status.RESOLVED, CacheStatus.FRESH];
    });
  }, deps, [cachedData ?? fallback, cacheExists ? Status.RESOLVED : Status.PENDING, cacheExists ? CacheStatus.CACHED : CacheStatus.FRESH]);

  return {
    isLoading: status === Status.PENDING,
    isSuccess: status === Status.RESOLVED,
    isCached: cacheStatus === CacheStatus.CACHED,
    isFresh: cacheStatus === CacheStatus.FRESH,
    status,
    cacheStatus,
    data
  };
};
