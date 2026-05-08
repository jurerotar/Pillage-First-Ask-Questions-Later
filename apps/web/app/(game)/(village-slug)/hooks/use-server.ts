import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { serverCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useServer = () => {
  const { apiClient } = use(ApiContext);

  const { data: server } = useSuspenseQuery({
    queryKey: [serverCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get('/server');

      return data;
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });

  const { id: serverId, slug: serverSlug } = server;
  const { mapSize, speed: serverSpeed } = server.configuration;

  return {
    server,
    serverId,
    serverSlug,
    mapSize,
    serverSpeed,
  };
};
