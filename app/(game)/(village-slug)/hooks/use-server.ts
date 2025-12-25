import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { serverCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { serverSchema } from 'app/interfaces/models/game/server';

export const useServer = () => {
  const { fetcher } = use(ApiContext);

  const { data: server } = useSuspenseQuery({
    queryKey: [serverCacheKey],
    queryFn: async () => {
      const { data } = await fetcher('/server');

      return serverSchema.parse(data);
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });

  const serverId = server.id;
  const { mapSize, speed: serverSpeed } = server.configuration;

  return {
    server,
    serverId,
    mapSize,
    serverSpeed,
  };
};
