import { isControllerMessageErrorNotificationMessageEvent } from 'app/(game)/providers/guards/api-notification-event-guards';

export type Fetcher = ReturnType<typeof createWorkerFetcher>;

export const createWorkerFetcher = (worker: Worker) => {
  return async <TData = void, TArgs = unknown>(
    url: string,
    init?: Omit<RequestInit, 'body'> & { body?: TArgs },
  ): Promise<{ data: TData }> => {
    const { port1, port2 } = new MessageChannel();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        port1.close();
        reject(new Error('Worker request timed out'));
      }, 10_000);

      const handler = (event: MessageEvent) => {
        const { data } = event;

        clearTimeout(timeout);
        port1.removeEventListener('message', handler);
        port1.close();

        if (isControllerMessageErrorNotificationMessageEvent(event)) {
          const { error } = data;

          reject(error);
          return;
        }

        resolve(data);
      };

      port1.addEventListener('message', handler);
      port1.start();

      worker.postMessage(
        {
          type: 'WORKER_MESSAGE',
          url,
          method: init?.method ?? 'GET',
          body: init?.body ?? null,
          ...init,
        },
        [port2],
      );
    });
  };
};
