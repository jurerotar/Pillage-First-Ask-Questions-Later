type ApiWorkerMessage = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown | null;
  params?: unknown | null;
};

export type PostMessage = Required<{ url: string } & ApiWorkerMessage>;

export const createWorkerFetcher = (worker: Worker) => {
  return async <TData>(url: string, args?: ApiWorkerMessage): Promise<{ data: TData }> => {
    const { port1, port2 } = new MessageChannel();

    return new Promise((resolve) => {
      port1.addEventListener('message', ({ data }) => {
        port1.close();
        resolve(data);
      });
      port1.start();

      const message: PostMessage = {
        url,
        method: args?.method ?? 'GET',
        body: args?.body ?? null,
        params: args?.params ?? null,
      };

      worker.postMessage(message, [port2]);
    });
  };
};
