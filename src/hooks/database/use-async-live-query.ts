import { useLiveQuery } from 'dexie-react-hooks';
import { CryliteDatabase, database } from 'database/database';

export enum Status {
  PENDING = 'pending',
  RESOLVED = 'resolved'
}

export type AsyncLiveQueryReturn<T = any> = AsyncLiveQueryReturnPending<T> | AsyncLiveQueryReturnResolved<T>;

export interface AsyncLiveQueryReturnPending<T> {
  isLoading: true;
  isSuccess: false;
  status: Status.PENDING;
  data: T;
}

export interface AsyncLiveQueryReturnResolved<T = any> {
  isLoading: false;
  isSuccess: true;
  status: Status.RESOLVED;
  data: T extends Array<infer U> ? Array<U> : (T | undefined);
}

export const useAsyncLiveQuery = <T>(
  querier: (db: CryliteDatabase) => Promise<T>,
  deps: any[] = [],
  defaultIfMissing?: T
): AsyncLiveQueryReturn<T> => {
  const db = database;
  const [data, status] = useLiveQuery(() => {
    return querier(db).then((data: T) => {
      const d = data === undefined ? defaultIfMissing : data;
      return [d, Status.RESOLVED];
    });
  }, deps, [defaultIfMissing, Status.PENDING]);

  return {
    isLoading: status === Status.PENDING,
    isSuccess: status === Status.RESOLVED,
    status,
    data
  } as AsyncLiveQueryReturn<T>;
};
