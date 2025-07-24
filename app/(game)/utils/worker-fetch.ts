export type Fetcher = ReturnType<typeof createWorkerFetcher>;

export const createWorkerFetcher = (worker: Worker) => {
  return async <TData = void, TArgs = unknown | null>(
    url: string,
    init?: Omit<RequestInit, 'body'> & { body?: TArgs },
  ): Promise<{ data: TData }> => {
    const { port1, port2 } = new MessageChannel();

    return new Promise((resolve) => {
      port1.addEventListener('message', ({ data }) => {
        port1.close();
        resolve(data);
      });
      port1.start();

      const message = {
        url,
        ...init,
        method: init?.method ?? 'GET',
        body: init?.body ?? null,
      };

      worker.postMessage(message, [port2]);
    });
  };
};
