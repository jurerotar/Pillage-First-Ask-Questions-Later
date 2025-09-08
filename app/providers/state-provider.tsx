import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useState } from 'react';

type StateProviderProps = {
  queryClient?: QueryClient;
};

export const StateProvider = ({
  children,
  queryClient: providedQueryClient,
}: PropsWithChildren<StateProviderProps>) => {
  const [queryClient] = useState<QueryClient>(
    providedQueryClient ??
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: Number.POSITIVE_INFINITY,
            networkMode: 'always',
          },
          mutations: {
            networkMode: 'always',
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
