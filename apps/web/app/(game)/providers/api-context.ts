import { createContext } from 'react';
import type { ApiClient } from 'app/(game)/providers/utils/typed-api-client';

export type ApiContextReturn = {
  apiWorker: Worker;
  apiClient: ApiClient;
};

export const ApiContext = createContext<ApiContextReturn>(
  {} as ApiContextReturn,
);
