import { createContext, type PropsWithChildren, useMemo } from 'react';
import type { Server } from '@pillage-first/types/models/server';
import { useApiWorker } from 'app/(game)/hooks/use-api-worker';
import {
  createWorkerFetcher,
  type Fetcher,
} from 'app/(game)/providers/utils/worker-fetch';

type ApiProviderProps = {
  serverSlug: Server['slug'];
};

type ApiContextReturn = {
  apiWorker: Worker;
  fetcher: Fetcher;
};

export const ApiContext = createContext<ApiContextReturn>(
  {} as ApiContextReturn,
);

export const ApiProvider = ({
  children,
  serverSlug,
}: PropsWithChildren<ApiProviderProps>) => {
  const { apiWorker } = useApiWorker(serverSlug);

  const fetcher = useMemo(() => createWorkerFetcher(apiWorker), [apiWorker]);

  const value: ApiContextReturn = useMemo(() => {
    return {
      apiWorker,
      fetcher,
    };
  }, [apiWorker, fetcher]);

  return <ApiContext value={value}>{children}</ApiContext>;
};
