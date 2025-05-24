import type React from 'react';
import { createContext, useMemo } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import ApiWorker from 'app/(game)/api/workers/api-worker?worker&url';
import { createWorkerFetcher } from 'app/(game)/utils/worker-fetch';
import type { Server } from 'app/interfaces/models/game/server';

type ApiContextProps = {
  serverSlug: Server['slug'];
};

type ApiContextReturn = {
  fetcher: ReturnType<typeof createWorkerFetcher>;
};

export const ApiContext = createContext<ApiContextReturn>({} as ApiContextReturn);

const createWorkerWithReadySignal = (serverSlug: string): Promise<Worker> => {
  return new Promise((resolve) => {
    const url = new URL(ApiWorker, import.meta.url);
    url.searchParams.set('server-slug', serverSlug);
    const worker = new Worker(url.toString(), { type: 'module' });

    const handleReady = (e: MessageEvent) => {
      if (e.data?.ready) {
        worker.removeEventListener('message', handleReady);
        resolve(worker);
      }
    };

    worker.addEventListener('message', handleReady);
  });
};

export const ApiProvider: React.FCWithChildren<ApiContextProps> = ({ serverSlug, children }) => {
  const { data: apiWorker } = useSuspenseQuery({
    queryKey: ['api-worker', serverSlug],
    queryFn: () => createWorkerWithReadySignal(serverSlug),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });

  const value: ApiContextReturn = useMemo(
    () => ({
      fetcher: createWorkerFetcher(apiWorker),
    }),
    [apiWorker],
  );

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};
