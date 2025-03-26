import { useQuery } from '@tanstack/react-query';
import type { Server } from 'app/interfaces/models/game/server';
import { serverCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

export const useServer = () => {
  const { data } = useQuery<Server>({
    queryKey: [serverCacheKey],
  });

  const server = data as Server;

  const serverId = server.id;
  const { mapSize, speed: serverSpeed } = server.configuration;

  return {
    server,
    serverId,
    mapSize,
    serverSpeed,
  };
};
