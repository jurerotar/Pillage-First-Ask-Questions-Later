import { useSuspenseQuery } from '@tanstack/react-query';
import { DatabaseInitializationError } from '@pillage-first/api/errors';
import ApiWorker from '@pillage-first/api?worker&url';
import type { WorkerInitializationErrorEvent } from '@pillage-first/types/api-events';
import type { Server } from '@pillage-first/types/models/server';
import { isNotificationMessageEvent } from 'app/(game)/providers/guards/api-notification-event-guards';

const createWorkerWithReadySignal = (serverSlug: string): Promise<Worker> => {
  return new Promise((resolve, reject) => {
    const url = new URL(ApiWorker, import.meta.url);
    url.searchParams.set('server-slug', serverSlug);
    const worker = new Worker(url.toString(), { type: 'module' });

    const handleWorkerInitializationMessage = (
      event: MessageEvent<WorkerInitializationErrorEvent>,
    ) => {
      if (!isNotificationMessageEvent(event)) {
        return;
      }

      if (event.data.eventKey === 'event:worker-initialization-success') {
        worker.removeEventListener(
          'message',
          handleWorkerInitializationMessage,
        );
        resolve(worker);
      }

      if (event.data.eventKey === 'event:worker-initialization-error') {
        worker.removeEventListener(
          'message',
          handleWorkerInitializationMessage,
        );
        reject(new DatabaseInitializationError());
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
    queryFn: () => createWorkerWithReadySignal(serverSlug),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    retry: false,
  });

  return {
    apiWorker,
  };
};
