import type React from 'react';
import { createContext, useEffect, useMemo } from 'react';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import ApiWorker from 'app/(game)/api/workers/api-worker?worker&url';
import {
  createWorkerFetcher,
  type Fetcher,
} from 'app/(game)/utils/worker-fetch';
import type { Server } from 'app/interfaces/models/game/server';
import type { ApiNotificationEvent } from 'app/interfaces/api';
import { eventsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import {
  isEventResolvedNotificationMessageEvent,
  isNotificationMessageEvent,
} from 'app/(game)/providers/guards/api-notification-event-guards';

type ApiContextProps = {
  serverSlug: Server['slug'];
};

type ApiContextReturn = {
  fetcher: Fetcher;
};

export const ApiContext = createContext<ApiContextReturn>(
  {} as ApiContextReturn,
);

const createWorkerWithReadySignal = (serverSlug: string): Promise<Worker> => {
  return new Promise((resolve) => {
    const url = new URL(ApiWorker, import.meta.url);
    url.searchParams.set('server-slug', serverSlug);
    const worker = new Worker(url.toString(), { type: 'module' });

    const handleWorkerReadyMessage = (event: MessageEvent) => {
      if (
        isNotificationMessageEvent(event) &&
        event.data.eventKey === 'event:worker-ready'
      ) {
        worker.removeEventListener('message', handleWorkerReadyMessage);
        resolve(worker);
      }
    };

    worker.addEventListener('message', handleWorkerReadyMessage);
  });
};

export const ApiProvider: React.FCWithChildren<ApiContextProps> = ({
  serverSlug,
  children,
}) => {
  const queryClient = useQueryClient();

  const { data: apiWorker } = useSuspenseQuery<Worker>({
    queryKey: ['api-worker', serverSlug],
    queryFn: () => createWorkerWithReadySignal(serverSlug),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });

  useEffect(() => {
    if (!apiWorker) {
      return;
    }

    const handleMessage = async (event: MessageEvent<ApiNotificationEvent>) => {
      if (!isNotificationMessageEvent(event)) {
        return;
      }

      if (isEventResolvedNotificationMessageEvent(event)) {
        const { cachesToClearOnResolve } = event.data;

        for (const queryKey of cachesToClearOnResolve) {
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
