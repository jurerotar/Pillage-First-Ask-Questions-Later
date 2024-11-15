import { useQuery } from '@tanstack/react-query';
import type { Server } from 'app/interfaces/models/game/server';
import { currentServerCacheKey } from 'app/query-keys';

export const useCurrentServer = () => {
  const { data } = useQuery<Server>({
    queryKey: [currentServerCacheKey],
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
