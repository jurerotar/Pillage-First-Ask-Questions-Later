import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type FCWithChildren, useState } from 'react';

type StateProviderProps = {
  queryClient?: QueryClient;
};

export const StateProvider: FCWithChildren<StateProviderProps> = ({ children, queryClient: providedQueryClient }) => {
  const [queryClient] = useState<QueryClient>(
    providedQueryClient ??
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: Number.POSITIVE_INFINITY,
            networkMode: 'always',
            // TODO: Investigate whether it makes sense to set staleTime or somehow reduce performance impact of opfs file reading!
          },
          mutations: {
            networkMode: 'always',
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
