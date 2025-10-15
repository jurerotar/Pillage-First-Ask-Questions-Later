import {
  createContext,
  useEffect,
  useMemo,
  type PropsWithChildren,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  createWorkerFetcher,
  type Fetcher,
} from 'app/(game)/utils/worker-fetch';
import type { EventApiNotificationEvent } from 'app/interfaces/api';
import { eventsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { isEventResolvedNotificationMessageEvent } from 'app/(game)/providers/guards/api-notification-event-guards';
import { useApiWorker } from 'app/(game)/hooks/use-api-worker';
import type { Server } from 'app/interfaces/models/game/server';
import { cachesToClearOnResolve } from 'app/(game)/providers/constants/caches-to-clear-on-resolve';

type ApiProviderProps = {
  serverSlug: Server['slug'];
};

type ApiContextReturn = {
  fetcher: Fetcher;
};

export const ApiContext = createContext<ApiContextReturn>(
  {} as ApiContextReturn,
);

export const ApiProvider = ({
  children,
  serverSlug,
}: PropsWithChildren<ApiProviderProps>) => {
  const queryClient = useQueryClient();
  const { apiWorker } = useApiWorker(serverSlug);

  useEffect(() => {
    if (!apiWorker) {
      return;
    }

    const handleMessage = async (
      event: MessageEvent<EventApiNotificationEvent>,
    ) => {
      if (!isEventResolvedNotificationMessageEvent(event)) {
        return;
      }

      const { type } = event.data;

      const cachesToClear = cachesToClearOnResolve.get(type)!;

      for (const queryKey of cachesToClear) {
        await queryClient.invalidateQueries({ queryKey: [queryKey] });
      }
      await queryClient.invalidateQueries({ queryKey: [eventsCacheKey] });
    };

    apiWorker.addEventListener('message', handleMessage);

    return () => {
      apiWorker.postMessage('WORKER_CLOSE');
      apiWorker.removeEventListener('message', handleMessage);
    };
  }, [apiWorker, queryClient]);

  const value: ApiContextReturn = useMemo(() => {
    return {
      fetcher: createWorkerFetcher(apiWorker),
    };
  }, [apiWorker]);

  return <ApiContext value={value}>{children}</ApiContext>;
};
