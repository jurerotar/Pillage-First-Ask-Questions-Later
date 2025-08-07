import type React from 'react';
import { createContext, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  createWorkerFetcher,
  type Fetcher,
} from 'app/(game)/utils/worker-fetch';
import type { EventApiNotificationEvent } from 'app/interfaces/api';
import { eventsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { isEventResolvedNotificationMessageEvent } from 'app/(game)/providers/guards/api-notification-event-guards';
import { useApiWorker } from 'app/(game)/hooks/use-api-worker';

type ApiContextReturn = {
  fetcher: Fetcher;
};

export const ApiContext = createContext<ApiContextReturn>(
  {} as ApiContextReturn,
);

export const ApiProvider: React.FCWithChildren = ({ children }) => {
  const queryClient = useQueryClient();
  const { apiWorker } = useApiWorker();

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

      const { cachesToClearOnResolve } = event.data;

      for (const queryKey of cachesToClearOnResolve) {
        await queryClient.invalidateQueries({ queryKey: [queryKey] });
      }
      await queryClient.invalidateQueries({ queryKey: [eventsCacheKey] });
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

  return <ApiContext value={value}>{children}</ApiContext>;
};
