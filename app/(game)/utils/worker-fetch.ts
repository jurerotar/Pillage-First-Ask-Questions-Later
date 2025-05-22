import type { routes } from 'app/(game)/api/routes';

type ApiWorkerMessage<TArgs> = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: TArgs;
};

type ApiWorkerResponse<TReturn> = {
  status: number;
  data: TReturn;
};

type PostMessage<TArgs> = ApiWorkerMessage<TArgs> & {
  url: keyof typeof routes;
};

export const createWorkerFetcher = (worker: Worker) => {
  return <TArgs, TReturn>(url: keyof typeof routes, args?: ApiWorkerMessage<TArgs>): Promise<ApiWorkerResponse<TReturn>> => {
    const { port1, port2 } = new MessageChannel();

    return new Promise<ApiWorkerResponse<TReturn>>((resolve) => {
      port1.addEventListener('message', ({ data }) => {
        port1.close();
        resolve(data);
      });
      port1.start();

      const data = {
        url,
        method: args?.method ?? 'GET',
        body: args?.body,
      } satisfies PostMessage<TArgs>;

      worker.postMessage(data, [port2]);
    });
  };
};
