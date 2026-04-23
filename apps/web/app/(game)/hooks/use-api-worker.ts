import { useSuspenseQuery } from '@tanstack/react-query';
import { OutdatedDatabaseSchemaError } from '@pillage-first/api/errors';
import ApiWorker from '@pillage-first/api?worker&url';
import type { Server } from '@pillage-first/types/models/server';
import {
  isDatabaseInitializationErrorNotificationMessageEvent,
  isDatabaseInitializationSuccessNotificationMessageEvent,
} from 'app/(game)/providers/guards/api-notification-event-guards';

const createWorkerWithReadySignal = (serverSlug: string): Promise<Worker> => {
  return new Promise((resolve, reject) => {
    const url = new URL(ApiWorker, import.meta.url);
    url.searchParams.set('server-slug', serverSlug);
    const worker = new Worker(url.toString(), { type: 'module' });

    const handleWorkerInitializationMessage = (event: MessageEvent) => {
      if (isDatabaseInitializationSuccessNotificationMessageEvent(event)) {
        worker.removeEventListener(
          'message',
          handleWorkerInitializationMessage,
        );
        resolve(worker);
      }

      if (isDatabaseInitializationErrorNotificationMessageEvent(event)) {
        worker.removeEventListener(
          'message',
          handleWorkerInitializationMessage,
        );

        const { error } = event.data;

        if (error.name === OutdatedDatabaseSchemaError.name) {
          reject(new OutdatedDatabaseSchemaError());
          return;
        }

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
  const { data: apiWorker } = useSuspenseQuery({
    queryKey: ['api-worker', serverSlug],
    queryFn: async () => createWorkerWithReadySignal(serverSlug),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });

  return {
    apiWorker,
  };
};
