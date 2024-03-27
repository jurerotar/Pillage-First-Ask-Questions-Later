import React, { FCWithChildren, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

type StateProviderProps = {
  queryClient?: QueryClient;
};

export const StateProvider: FCWithChildren<StateProviderProps> = ({ children, queryClient: providedQueryClient }) => {
  const [queryClient] = useState<QueryClient>(
    providedQueryClient ??
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: Infinity,
            networkMode: 'always',
          },
          mutations: {
            networkMode: 'always',
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
