import { useQuery } from '@tanstack/react-query';
import { useRouteSegments } from 'app/[game]/hooks/routes/use-route-segments';
import type { Server } from 'interfaces/models/game/server';
import { getParsedFileContents, getServerHandle } from 'app/utils/opfs';

export const currentServerCacheKey = 'current-server';
export const serverHandleCacheKey = 'server-handle';

export const useCurrentServer = () => {
  const { serverSlug } = useRouteSegments();

  const { data: dataHandle } = useQuery<FileSystemDirectoryHandle>({
    queryFn: () => getServerHandle(serverSlug),
    queryKey: [serverHandleCacheKey],
  });

  const serverHandle = dataHandle as FileSystemDirectoryHandle;

  const { data } = useQuery<Server>({
    queryFn: () => getParsedFileContents<Server>(serverHandle, 'server'),
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
    serverHandle,
  };
};
