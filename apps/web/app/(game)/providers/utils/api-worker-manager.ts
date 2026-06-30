import ApiWorker from '@pillage-first/api?worker&url';
import type { Server } from '@pillage-first/types/models/server';
import { OutdatedDatabaseSchemaError } from '@pillage-first/utils/errors';
import {
  isDatabaseInitializationErrorNotificationMessageEvent,
  isDatabaseInitializationSuccessNotificationMessageEvent,
} from 'app/(game)/providers/guards/api-notification-event-guards';

type WorkerNotificationListener = (event: MessageEvent) => void;

export type ApiWorkerHandle = {
  apiWorker: Worker;
  closeApiWorker: () => Promise<void>;
  subscribeToApiWorkerNotifications: (
    listener: WorkerNotificationListener,
  ) => () => void;
};

const apiWorkerHandles = new Map<Server['slug'], Promise<ApiWorkerHandle>>();

const createApiWorkerHandle = (
  serverSlug: Server['slug'],
  worker: Worker,
  notificationPort: MessagePort,
): ApiWorkerHandle => {
  let subscriberCount = 0;
  let isClosed = false;
  // Multiple UI paths can request shutdown during navigation/unmount; only send one close request to the worker.
  let closePromise: Promise<void> | null = null;

  const subscribeToApiWorkerNotifications = (
    listener: WorkerNotificationListener,
  ) => {
    notificationPort.addEventListener('message', listener);

    if (subscriberCount === 0) {
      worker.postMessage({ type: 'WORKER_START_NOTIFICATION_POSTING' });
    }

    subscriberCount += 1;

    return () => {
      notificationPort.removeEventListener('message', listener);
      subscriberCount = Math.max(0, subscriberCount - 1);

      if (!isClosed && subscriberCount === 0) {
        worker.postMessage({ type: 'WORKER_STOP_NOTIFICATION_POSTING' });
      }
    };
  };

  const closeApiWorker = () => {
    if (isClosed) {
      return Promise.resolve();
    }

    // Reuse the in-flight close so duplicate callers wait for the same database/OPFS cleanup.
    closePromise ??= new Promise<void>((resolve) => {
      const handleClose = ({ data }: MessageEvent) => {
        if (data?.type !== 'WORKER_CLOSE_SUCCESS') {
          return;
        }

        notificationPort.removeEventListener('message', handleClose);
        isClosed = true;
        subscriberCount = 0;
        notificationPort.close();
        worker.terminate();
        apiWorkerHandles.delete(serverSlug);
        resolve();
      };

      notificationPort.addEventListener('message', handleClose);
      worker.postMessage({ type: 'WORKER_CLOSE' });
    });

    return closePromise;
  };

  return {
    apiWorker: worker,
    closeApiWorker,
    subscribeToApiWorkerNotifications,
  };
};

const createWorkerWithReadySignal = (
  serverSlug: Server['slug'],
): Promise<ApiWorkerHandle> => {
  return new Promise((resolve, reject) => {
    const url = new URL(ApiWorker, import.meta.url);
    url.searchParams.set('server-slug', serverSlug);
    const worker = new Worker(url.toString(), { type: 'module' });
    const { port1, port2 } = new MessageChannel();

    port1.start();

    const handleWorkerInitializationMessage = (event: MessageEvent) => {
      if (isDatabaseInitializationSuccessNotificationMessageEvent(event)) {
        port1.removeEventListener('message', handleWorkerInitializationMessage);
        resolve(createApiWorkerHandle(serverSlug, worker, port1));
      }

      if (isDatabaseInitializationErrorNotificationMessageEvent(event)) {
        port1.removeEventListener('message', handleWorkerInitializationMessage);

        const { error } = event.data;
        port1.close();
        worker.terminate();

        if (error.name === OutdatedDatabaseSchemaError.name) {
          reject(new OutdatedDatabaseSchemaError());
          return;
        }

        reject(error);
      }
    };

    port1.addEventListener('message', handleWorkerInitializationMessage);

    worker.postMessage(
      {
        type: 'WORKER_INIT',
      },
      [port2],
    );
  });
};

export const getApiWorkerHandle = (
  serverSlug: Server['slug'],
): Promise<ApiWorkerHandle> => {
  const existingHandle = apiWorkerHandles.get(serverSlug);

  if (existingHandle) {
    return existingHandle;
  }

  const handle = createWorkerWithReadySignal(serverSlug).catch((error) => {
    apiWorkerHandles.delete(serverSlug);
    throw error;
  });

  apiWorkerHandles.set(serverSlug, handle);

  return handle;
};

export const closeAllApiWorkers = async (): Promise<void> => {
  const handles = [...apiWorkerHandles.values()];

  await Promise.allSettled(
    handles.map(async (handle) => {
      const { closeApiWorker } = await handle;
      await closeApiWorker();
    }),
  );
};
