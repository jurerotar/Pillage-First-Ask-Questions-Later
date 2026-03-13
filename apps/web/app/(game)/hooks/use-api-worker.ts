import {
  type QueryClient,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import ApiWorker from '@pillage-first/api?worker&url';
import type { Server } from '@pillage-first/types/models/server';
import {
  appTimeCacheKey,
  isVacationModeEnabledCacheKey,
} from 'app/(game)/constants/query-keys.ts';
import {
  isDatabaseInitializationErrorNotificationMessageEvent,
  isDatabaseInitializationSuccessNotificationMessageEvent,
  isNotificationMessageEvent,
} from 'app/(game)/providers/guards/api-notification-event-guards';

const createWorkerWithReadySignal = (
  serverSlug: string,
  queryClient: QueryClient,
): Promise<Worker> => {
  return new Promise((resolve, reject) => {
    const url = new URL(ApiWorker, import.meta.url);
    url.searchParams.set('server-slug', serverSlug);
    const worker = new Worker(url.toString(), { type: 'module' });

    const removeWorkerEventListener = () => {
      worker.removeEventListener('message', handleWorkerInitializationMessage);
    };

    const handleWorkerInitializationMessage = (event: MessageEvent) => {
      if (!isNotificationMessageEvent(event)) {
        return;
      }

      if (isDatabaseInitializationSuccessNotificationMessageEvent(event)) {
        const { isVacationModeEnabled, appTime } = event.data;

        queryClient.setQueryData(
          [isVacationModeEnabledCacheKey],
          isVacationModeEnabled,
        );
        queryClient.setQueryData([appTimeCacheKey], appTime);

        removeWorkerEventListener();
        resolve(worker);
      }

      if (isDatabaseInitializationErrorNotificationMessageEvent(event)) {
        const { error } = event.data;

        removeWorkerEventListener();
        // Propagate error to error-boundary
        reject(error);
      }
    };

    worker.addEventListener('message', handleWorkerInitializationMessage);

    worker.postMessage({
      type: 'WORKER_INIT',
    });
  });
};

export const useApiWorker = (serverSlug: Server['slug']) => {
  const queryClient = useQueryClient();

  const { data } = useSuspenseQuery({
    queryKey: ['api-worker', serverSlug],
    queryFn: () => createWorkerWithReadySignal(serverSlug, queryClient),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });

  return {
    apiWorker: data,
  };
};
