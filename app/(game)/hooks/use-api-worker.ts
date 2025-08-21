import { useSuspenseQuery } from '@tanstack/react-query';
import ApiWorker from 'app/(game)/api/workers/api-worker?worker&url';
import type { WorkerInitializationErrorEvent } from 'app/interfaces/api';
import { isNotificationMessageEvent } from 'app/(game)/providers/guards/api-notification-event-guards';
import { useRouteSegments } from 'app/(game)/(village-slug)/hooks/routes/use-route-segments';

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

export const useApiWorker = () => {
  const { serverSlug } = useRouteSegments();

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
