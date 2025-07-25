import { useSuspenseQuery } from '@tanstack/react-query';
import type { Server } from 'app/interfaces/models/game/server';
import { serverCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useServer = () => {
  const { fetcher } = use(ApiContext);

  const { data: server } = useSuspenseQuery<Server>({
    queryKey: [serverCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<Server>('/server');
      return data;
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });

  const serverId = server.id;
  const mapSize = server.configuration.mapSize;
  const serverSpeed = server.configuration.speed;

  return {
    server,
    serverId,
    mapSize,
    serverSpeed,
  };
};
