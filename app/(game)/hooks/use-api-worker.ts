import { useSuspenseQuery } from '@tanstack/react-query';
import ApiWorker from 'app/(game)/api/workers/api-worker?worker&url';
import { isNotificationMessageEvent } from 'app/(game)/providers/guards/api-notification-event-guards';
import type { WorkerInitializationErrorEvent } from 'app/interfaces/api';
import type { Server } from 'app/interfaces/models/game/server';

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
        reject(new Error(event.data.error.message));
      }
    };

    worker.addEventListener('message', handleWorkerInitializationMessage);
  });
};

export const useApiWorker = (serverSlug: Server['slug']) => {
  const { data: apiWorker } = useSuspenseQuery<Worker>({
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
