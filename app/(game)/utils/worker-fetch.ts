import type { ApiMethod, ApiRoute, HandlerArgs, HandlerReturn } from 'app/interfaces/api';

type ApiWorkerMessage<TArgs = unknown> = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: TArgs | null;
};

type ApiWorkerResponse<TReturn> = {
  status: number;
  data: TReturn;
};

export type PostMessage<TArgs> = Required<ApiWorkerMessage<TArgs>> & {
  url: string;
};

export const createWorkerFetcher = (worker: Worker) => {
  return <Route extends ApiRoute, Method extends ApiMethod>(
    url: ApiRoute | string,
    args?: ApiWorkerMessage<HandlerArgs<Route, Method>>,
  ): Promise<ApiWorkerResponse<HandlerReturn<Route, Method>>> => {
    const { port1, port2 } = new MessageChannel();

    return new Promise<ApiWorkerResponse<HandlerReturn<Route, Method>>>((resolve) => {
      port1.addEventListener('message', ({ data }) => {
        port1.close();
        resolve(data);
      });
      port1.start();

      const data = {
        url,
        method: args?.method ?? 'GET',
        body: args?.body ?? null,
      } satisfies PostMessage<HandlerArgs<Route, Method>>;

      worker.postMessage(data, [port2]);
    });
  };
};
