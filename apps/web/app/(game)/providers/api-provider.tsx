import { type QueryKey, useQueryClient } from '@tanstack/react-query';
import { debounce } from 'moderndash';
import { type PropsWithChildren, useEffect, useMemo } from 'react';
import type { EventApiNotificationEvent } from '@pillage-first/types/api-events';
import type { Server } from '@pillage-first/types/models/server';
import { useApiWorker } from 'app/(game)/hooks/use-api-worker';
import {
  ApiContext,
  type ApiContextReturn,
} from 'app/(game)/providers/api-context';
import { cachesToClearOnResolve } from 'app/(game)/providers/constants/caches-to-clear-on-resolve';
import { isEventResolvedSuccessfullyNotificationMessageEvent } from 'app/(game)/providers/guards/api-notification-event-guards';
import { createTypedApiClient } from 'app/(game)/providers/utils/typed-api-client';
import { createWorkerFetcher } from 'app/(game)/providers/utils/worker-fetch';
import { reportError } from 'app/instrumentation/report-error';

type ApiProviderProps = {
  serverSlug: Server['slug'];
};

export const ApiProviderFallback = () => {
  return (
    <div className="flex h-dvh w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,theme(colors.amber.50),theme(colors.background)_58%)] px-6 text-foreground dark:bg-[radial-gradient(circle_at_center,theme(colors.stone.900),theme(colors.background)_58%)]">
      <div
        className="animate-api-provider-splash flex w-full max-w-md flex-col items-center gap-8 text-center"
        role="status"
        aria-live="polite"
      >
        <img
          src="/pillage-first-logo-horizontal.svg"
          alt="Pillage First! logo"
          className="animate-api-provider-splash-logo h-auto w-56 max-w-full sm:w-72"
        />
        <div className="animate-api-provider-splash-logo flex w-full max-w-56 flex-col gap-3 sm:max-w-xs">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="animate-api-provider-splash-progress h-full w-1/2 rounded-full bg-linear-to-r from-amber-500 via-orange-500 to-amber-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

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
