import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type PropsWithChildren, useState } from 'react';

export const StateProvider = ({ children }: PropsWithChildren) => {
  const [queryClient] = useState<QueryClient>(() => {
    return new QueryClient({
      defaultOptions: {
        queries: {
          gcTime: Number.POSITIVE_INFINITY,
          networkMode: 'always',
        },
        mutations: {
          networkMode: 'always',
        },
      },
    });
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
