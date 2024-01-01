import React, { FCWithChildren, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

type StateProviderProps = {
  queryClient?: QueryClient;
};

export const StateProvider: FCWithChildren<StateProviderProps> = ({ children, queryClient: providedQueryClient }) => {
  const [queryClient] = useState<QueryClient>(
    providedQueryClient ??
      new QueryClient({
        defaultOptions: {
          queries: {
            networkMode: 'always',
          },
          mutations: {
            networkMode: 'always',
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      {children}
    </QueryClientProvider>
  );
};
