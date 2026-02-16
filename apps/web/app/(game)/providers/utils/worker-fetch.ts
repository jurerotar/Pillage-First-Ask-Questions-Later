import { DatabaseInitializationError } from '@pillage-first/api/errors';
import { isControllerMessageErrorNotificationMessageEvent } from 'app/(game)/providers/guards/api-notification-event-guards.ts';

export type Fetcher = ReturnType<typeof createWorkerFetcher>;

export const createWorkerFetcher = (worker: Worker) => {
  return async <TData = void, TArgs = unknown>(
    url: string,
    init?: Omit<RequestInit, 'body'> & { body?: TArgs },
  ): Promise<{ data: TData }> => {
    const { port1, port2 } = new MessageChannel();

    return new Promise((resolve, reject) => {
      port1.addEventListener('message', (event: MessageEvent) => {
        const { data } = event;
        port1.close();

        if (isControllerMessageErrorNotificationMessageEvent(event)) {
          const { data } = event;
          const { error } = data;

          if (error.message.includes('sqlite3 result code 1')) {
            reject(new DatabaseInitializationError());
          }

          reject(data);
        }

        resolve(data);
      });

      port1.start();

      const message = {
        url,
        ...init,
        method: init?.method ?? 'GET',
        body: init?.body ?? null,
        type: 'WORKER_MESSAGE',
      };

      worker.postMessage(message, [port2]);
    });
  };
};
