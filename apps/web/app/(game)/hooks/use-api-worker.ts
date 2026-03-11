import { useSuspenseQuery } from '@tanstack/react-query';
import ApiWorker from '@pillage-first/api?worker&url';
import type { Server } from '@pillage-first/types/models/server';
import {
  isDatabaseInitializationErrorNotificationMessageEvent,
  isDatabaseInitializationSuccessNotificationMessageEvent,
  isNotificationMessageEvent,
} from 'app/(game)/providers/guards/api-notification-event-guards';

const createWorkerWithReadySignal = (serverSlug: string): Promise<Worker> => {
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
  const { data } = useSuspenseQuery({
    queryKey: ['api-worker', serverSlug],
    queryFn: () => createWorkerWithReadySignal(serverSlug),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });

  return {
    apiWorker: data,
  };
};
