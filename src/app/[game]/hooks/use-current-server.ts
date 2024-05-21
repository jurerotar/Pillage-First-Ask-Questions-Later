import { useQuery } from '@tanstack/react-query';
import { useRouteSegments } from 'app/[game]/hooks/routes/use-route-segments';
import { database } from 'database/database';
import type { Server } from 'interfaces/models/game/server';

export const currentServerCacheKey = 'current-server';

export const getCurrentServer = (serverSlug: Server['slug']) => database.servers.where({ slug: serverSlug }).first() as Promise<Server>;

export const useCurrentServer = () => {
  const { serverSlug } = useRouteSegments();

  const { data } = useQuery<Server>({
    queryKey: [currentServerCacheKey, serverSlug],
    queryFn: () => getCurrentServer(serverSlug),
  });

  // Due to us working with only local data, which is prefetched in loader, we can do this assertion to save us from having to spam "!" everywhere
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
