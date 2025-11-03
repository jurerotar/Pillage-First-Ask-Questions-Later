import { useSuspenseQuery } from '@tanstack/react-query';
import ApiSharedWorker from 'app/(game)/api/api-shared-worker?sharedworker&url';
import type { WorkerInitializationErrorEvent } from 'app/interfaces/api';
import { isNotificationMessageEvent } from 'app/(game)/providers/guards/api-notification-event-guards';
import type { Server } from 'app/interfaces/models/game/server';
import type { PostMessageTarget } from 'app/(game)/utils/worker-fetch';

const createSharedWorkerTarget = (
  serverSlug: string,
): Promise<PostMessageTarget> => {
  return new Promise((resolve, reject) => {
    const sharedUrl = new URL(ApiSharedWorker, import.meta.url);
    sharedUrl.searchParams.set('server-slug', serverSlug);
    const shared = new SharedWorker(sharedUrl.toString(), { type: 'module' });
    shared.port.start();
    const target = shared.port as PostMessageTarget;

    const handleInit = (
      event: MessageEvent<WorkerInitializationErrorEvent>,
    ) => {
      if (!isNotificationMessageEvent(event)) {
        return;
      }

      if (event.data.eventKey === 'event:worker-initialization-success') {
        target.removeEventListener('message', handleInit);
        resolve(target);
        return;
      }

      if (event.data.eventKey === 'event:worker-initialization-error') {
        target.removeEventListener('message', handleInit);
        reject(new Error(event.data.error.message));
      }
    };

    target.addEventListener('message', handleInit);
  });
};

export const useApiWorker = (serverSlug: Server['slug']) => {
  const { data: apiWorker } = useSuspenseQuery({
    queryKey: ['api-worker', serverSlug],
    queryFn: () => createSharedWorkerTarget(serverSlug),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    retry: false,
  });

  return {
    apiWorker,
  };
};
