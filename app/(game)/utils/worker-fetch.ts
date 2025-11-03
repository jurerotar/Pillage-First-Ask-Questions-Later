export type Fetcher = ReturnType<typeof createWorkerFetcher>;

export type PostMessageTarget = MessagePort;

type WorkerRequestMessage<TArgs> = {
  type: 'WORKER_MESSAGE';
  url: string;
  method: string;
  body: TArgs | null;
};

export const createWorkerFetcher = (target: PostMessageTarget) => {
  return async <TData = void, TArgs = unknown>(
    url: string,
    init?: Omit<RequestInit, 'body'> & { body?: TArgs },
  ): Promise<{ data: TData }> => {
    const { port1, port2 } = new MessageChannel();

    return new Promise((resolve) => {
      port1.addEventListener('message', ({ data }) => {
        port1.close();
        resolve(data as { data: TData });
      });
      port1.start();

      const message: WorkerRequestMessage<TArgs> = {
        url,
        ...(init as Omit<RequestInit, 'body'>),
        method: init?.method ?? 'GET',
        body: (init?.body as TArgs | undefined) ?? null,
        type: 'WORKER_MESSAGE',
      };

      // Send the request to the shared worker via MessagePort
      target.postMessage(message, [port2]);
    });
  };
};
