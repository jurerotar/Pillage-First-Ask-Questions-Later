import type React from 'react';
import { createContext, useEffect, useState } from 'react';
import ApiWorker from 'app/(game)/api/workers/api-worker?worker&url';
import type { Server } from 'app/interfaces/models/game/server';
import { createWorkerFetcher } from 'app/(game)/utils/worker-fetch';

type ApiContextProps = {
  serverSlug: Server['slug'];
};

type ApiContextReturn = {
  apiWorker: Worker;
  workerFetch: ReturnType<typeof createWorkerFetcher>;
};

export const ApiContext = createContext<ApiContextReturn>({} as ApiContextReturn);

export const ApiProvider: React.FCWithChildren<ApiContextProps> = ({ children, serverSlug }) => {
  const [apiWorker, setApiWorker] = useState<Worker | null>(null);

  useEffect(() => {
    if (!apiWorker) {
      const url = new URL(ApiWorker, import.meta.url);
      url.searchParams.set('server-slug', serverSlug);
      const worker = new Worker(url.toString(), { type: 'module' });
      setApiWorker(worker);
    }

    return () => {
      if (apiWorker) {
        apiWorker.terminate();
      }
    };
  }, [apiWorker, serverSlug]);

  if (!apiWorker) {
    return 'loading worker';
  }

  const workerFetch = createWorkerFetcher(apiWorker);

  const value: ApiContextReturn = {
    apiWorker,
    workerFetch,
  };

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};
