import React, { FCWithChildren, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export const StateProvider: FCWithChildren = ({ children }) => {
  const [queryClient] = useState<QueryClient>(() => new QueryClient({
    defaultOptions: {
      queries: {
        networkMode: 'always'
      },
      mutations: {
        networkMode: 'always'
      }
    }
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      {children}
    </QueryClientProvider>
  );
};
