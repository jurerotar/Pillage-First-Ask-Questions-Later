import { useQueryClient } from '@tanstack/react-query';
import { debounce } from 'moderndash';
import {
  createContext,
  type PropsWithChildren,
  useEffect,
  useMemo,
} from 'react';
import { eventsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { useApiWorker } from 'app/(game)/hooks/use-api-worker';
import { cachesToClearOnResolve } from 'app/(game)/providers/constants/caches-to-clear-on-resolve';
import { isEventResolvedNotificationMessageEvent } from 'app/(game)/providers/guards/api-notification-event-guards';
import {
  createWorkerFetcher,
  type Fetcher,
} from 'app/(game)/utils/worker-fetch';
import type { EventApiNotificationEvent } from 'app/interfaces/api';
import type { Server } from 'app/interfaces/models/game/server';

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
  const queryClient = useQueryClient();
  const { apiWorker } = useApiWorker(serverSlug);

  useEffect(() => {
    if (!apiWorker) {
      return;
    }

    const DEBOUNCE_MS = 150;
    const debouncedInvalidators = new Map<
      string,
      ReturnType<typeof debounce>
    >();

    const makeDebouncedInvalidator = (
      keyId: string,
      resolvedKey: readonly unknown[],
    ) => {
      const fn = async () => {
        try {
          await queryClient.invalidateQueries({
            queryKey: Array.from(resolvedKey),
          });
        } catch (error) {
          console.error('Failed to invalidate query', resolvedKey, error);
        }
      };

      // create debounced wrapper and store it
      const debounced = debounce(fn, DEBOUNCE_MS);
      debouncedInvalidators.set(keyId, debounced);
      return debounced;
    };

    const handleMessage = (event: MessageEvent<EventApiNotificationEvent>) => {
      if (!isEventResolvedNotificationMessageEvent(event)) {
        return;
      }

      const { type } = event.data;
      const cachesToClear = cachesToClearOnResolve.get(type)!;

      for (const queryKey of cachesToClear) {
        const keyId = JSON.stringify(queryKey);

        const resolvedKey = Array.isArray(queryKey) ? queryKey : [queryKey];
        const debounced =
          debouncedInvalidators.get(keyId) ??
          makeDebouncedInvalidator(keyId, resolvedKey);
        debounced();
      }

      // also debounce invalidation of the global events cache key
      const eventsKeyId = JSON.stringify(eventsCacheKey);

      const evResolvedKey = [eventsCacheKey];
      const evDebounced =
        debouncedInvalidators.get(eventsKeyId) ??
        makeDebouncedInvalidator(eventsKeyId, evResolvedKey);
      evDebounced();
    };

    apiWorker.addEventListener('message', handleMessage);

    return () => {
      apiWorker.removeEventListener('message', handleMessage);

      // Attempt to cancel pending debounced calls
      for (const debounced of debouncedInvalidators.values()) {
        if (typeof debounced.cancel === 'function') {
          debounced.cancel();
        }
      }
      debouncedInvalidators.clear();
    };
  }, [apiWorker, queryClient]);

  const value: ApiContextReturn = useMemo(() => {
    return {
      apiWorker,
      fetcher: createWorkerFetcher(apiWorker),
    };
  }, [apiWorker]);

  return <ApiContext value={value}>{children}</ApiContext>;
};
