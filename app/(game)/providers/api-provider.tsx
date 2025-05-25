import type React from 'react';
import { createContext, useEffect, useMemo } from 'react';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import ApiWorker from 'app/(game)/api/workers/api-worker?worker&url';
import { createWorkerFetcher, type Fetcher } from 'app/(game)/utils/worker-fetch';
import type { Server } from 'app/interfaces/models/game/server';
import type { EventNotifierEventResolvedArgs } from 'app/interfaces/api';
import { eventsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

type ApiContextProps = {
  serverSlug: Server['slug'];
};

type ApiContextReturn = {
  fetcher: Fetcher;
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
  const queryClient = useQueryClient();

  const { data: apiWorker } = useSuspenseQuery({
    queryKey: ['api-worker', serverSlug],
    queryFn: () => createWorkerWithReadySignal(serverSlug),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });

  useEffect(() => {
    if (!apiWorker) {
      return;
    }

    const handleMessage = async (e: MessageEvent<EventNotifierEventResolvedArgs>) => {
      if (e.data.type === 'event:resolved') {
        for (const queryKey of e.data.cachesToClear) {
          await queryClient.invalidateQueries({ queryKey: [queryKey] });
        }
        await queryClient.invalidateQueries({ queryKey: [eventsCacheKey] });
      }
    };

    apiWorker.addEventListener('message', handleMessage);

    return () => {
      apiWorker.removeEventListener('message', handleMessage);
    };
  }, [apiWorker, queryClient]);

  const value: ApiContextReturn = useMemo(() => {
    return {
      fetcher: createWorkerFetcher(apiWorker),
    };
  }, [apiWorker]);

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};
