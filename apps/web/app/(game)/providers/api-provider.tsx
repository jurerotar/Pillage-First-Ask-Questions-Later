import { type QueryKey, useQueryClient } from '@tanstack/react-query';
import { debounce } from 'moderndash';
import {
  createContext,
  type PropsWithChildren,
  useEffect,
  useMemo,
} from 'react';
import type { EventApiNotificationEvent } from '@pillage-first/types/api-events';
import type { Server } from '@pillage-first/types/models/server';
import { useApiWorker } from 'app/(game)/hooks/use-api-worker';
import { cachesToClearOnResolve } from 'app/(game)/providers/constants/caches-to-clear-on-resolve';
import { isEventResolvedSuccessfullyNotificationMessageEvent } from 'app/(game)/providers/guards/api-notification-event-guards';
import {
  type ApiClient,
  createTypedApiClient,
} from 'app/(game)/providers/utils/typed-api-client';
import { createWorkerFetcher } from 'app/(game)/providers/utils/worker-fetch';
import { reportError } from 'app/instrumentation/report-error';

type ApiProviderProps = {
  serverSlug: Server['slug'];
};

type ApiContextReturn = {
  apiWorker: Worker;
  apiClient: ApiClient;
};

export const ApiContext = createContext<ApiContextReturn>(
  {} as ApiContextReturn,
);

export const ApiProvider = ({
  children,
  serverSlug,
}: PropsWithChildren<ApiProviderProps>) => {
  const queryClient = useQueryClient();
  const { apiWorker, subscribeToApiWorkerNotifications } =
    useApiWorker(serverSlug);

  useEffect(() => {
    if (!apiWorker) {
      return;
    }

    const DEBOUNCE_MS = 150;
    const debouncedInvalidators = new Map<
      string,
      ReturnType<typeof debounce>
    >();

    const makeDebouncedInvalidator = (keyId: string, resolvedKey: QueryKey) => {
      const fn = async () => {
        try {
          await queryClient.invalidateQueries({
            queryKey: resolvedKey,
          });
        } catch (error) {
          reportError(error, 'Failed to invalidate query', {
            queryKey: JSON.stringify(resolvedKey),
            source: 'ApiProvider',
          });
        }
      };

      // create debounced wrapper and store it
      const debounced = debounce(fn, DEBOUNCE_MS);
      debouncedInvalidators.set(keyId, debounced);
      return debounced;
    };

    const handleMessage = (event: MessageEvent<EventApiNotificationEvent>) => {
      if (!isEventResolvedSuccessfullyNotificationMessageEvent(event)) {
        return;
      }

      const gameEvent = event.data;
      const { type } = gameEvent;

      // @ts-expect-error - We can't provide a generic here, so TS doesn't know which event it's dealing with
      const cachesToClear = cachesToClearOnResolve[type](gameEvent);

      for (const queryKey of cachesToClear) {
        const keyId = JSON.stringify(queryKey);

        const debounced =
          debouncedInvalidators.get(keyId) ??
          makeDebouncedInvalidator(keyId, queryKey);
        debounced();
      }
    };

    const unsubscribe = subscribeToApiWorkerNotifications(handleMessage);

    return () => {
      unsubscribe();

      // Attempt to cancel pending debounced calls
      for (const debounced of debouncedInvalidators.values()) {
        if (typeof debounced.cancel === 'function') {
          debounced.cancel();
        }
      }
      debouncedInvalidators.clear();
    };
  }, [queryClient, subscribeToApiWorkerNotifications, apiWorker]);

  const value: ApiContextReturn = useMemo(() => {
    const fetcher = createWorkerFetcher(apiWorker);

    return {
      apiWorker,
      apiClient: createTypedApiClient(fetcher),
    };
  }, [apiWorker]);

  return <ApiContext value={value}>{children}</ApiContext>;
};
