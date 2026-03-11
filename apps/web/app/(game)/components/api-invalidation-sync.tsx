import { useQueryClient } from '@tanstack/react-query';
import { debounce } from 'moderndash';
import { use, useEffect } from 'react';
import type { EventApiNotificationEvent } from '@pillage-first/types/api-events';
import { eventsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys.ts';
import { ApiContext } from 'app/(game)/providers/api-provider.tsx';
import { cachesToClearOnResolve } from 'app/(game)/providers/constants/caches-to-clear-on-resolve.ts';
import { isEventResolvedSuccessfullyNotificationMessageEvent } from 'app/(game)/providers/guards/api-notification-event-guards.ts';

export const ApiInvalidationSync = () => {
  const queryClient = useQueryClient();
  const { apiWorker } = use(ApiContext);

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
      const cachesToClear = cachesToClearOnResolve[type](gameEvent)!;

      for (const queryKey of cachesToClear) {
        const keyId = JSON.stringify(queryKey);

        const resolvedKey = Array.isArray(queryKey) ? queryKey : [queryKey];
        const debounced =
          debouncedInvalidators.get(keyId) ??
          makeDebouncedInvalidator(keyId, resolvedKey);
        debounced();
      }

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

      for (const debounced of debouncedInvalidators.values()) {
        if (typeof debounced.cancel === 'function') {
          debounced.cancel();
        }
      }

      debouncedInvalidators.clear();
    };
  }, [apiWorker, queryClient]);

  return null;
};
