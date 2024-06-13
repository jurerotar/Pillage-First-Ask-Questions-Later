import { QueryClient, dehydrate } from '@tanstack/react-query';
import { mapFiltersCacheKey } from 'app/[game]/[map]/hooks/use-map-filters';
import { mapMarkersCacheKey } from 'app/[game]/[map]/hooks/use-map-markers';
import { achievementsCacheKey } from 'app/[game]/hooks/use-achievements';
import { currentServerCacheKey, serverHandleCacheKey } from 'app/[game]/hooks/use-current-server';
import { effectsCacheKey } from 'app/[game]/hooks/use-effects';
import { eventsCacheKey } from 'app/[game]/hooks/use-events';
import { heroCacheKey } from 'app/[game]/hooks/use-hero';
import { mapCacheKey } from 'app/[game]/hooks/use-map';
import { playersCacheKey } from 'app/[game]/hooks/use-players';
import { questsCacheKey } from 'app/[game]/hooks/use-quests';
import { reportsCacheKey } from 'app/[game]/hooks/use-reports';
import { reputationsCacheKey } from 'app/[game]/hooks/use-reputations';
import { troopsCacheKey } from 'app/[game]/hooks/use-troops';
import { villagesCacheKey } from 'app/[game]/hooks/use-villages';
import type { GameEvent } from 'interfaces/models/events/game-event';
import type { Achievement } from 'interfaces/models/game/achievement';
import type { Effect } from 'interfaces/models/game/effect';
import type { Hero } from 'interfaces/models/game/hero';
import type { MapFilters } from 'interfaces/models/game/map-filters';
import type { MapMarker } from 'interfaces/models/game/map-marker';
import type { Player } from 'interfaces/models/game/player';
import type { Quest } from 'interfaces/models/game/quest';
import type { Report } from 'interfaces/models/game/report';
import type { Reputation } from 'interfaces/models/game/reputation';
import type { Server } from 'interfaces/models/game/server';
import type { Tile } from 'interfaces/models/game/tile';
import type { Troop } from 'interfaces/models/game/troop';
import type { Village } from 'interfaces/models/game/village';
import type { LoaderFunction } from 'react-router-dom';
import { getParsedFileContents, getServerHandle } from 'app/utils/opfs';

class MissingServerError extends Error {
  constructor(serverSlug: Server['slug']) {
    super();
    this.name = 'MissingServerError';
    this.message = `Server with slug "${serverSlug}" does not exist. If you're accessing this server from an url, try accessing the server from the homepage, to make sure the server still exists.`;
  }
}

type GameLoaderParams = Record<'serverSlug' | 'villageSlug', string>;

const createHydratedGameQueryClient = async (serverHandle: FileSystemDirectoryHandle): Promise<QueryClient> => {
  const queryClient = new QueryClient();

  await Promise.allSettled([
    queryClient.prefetchQuery<Server>({
      queryKey: [currentServerCacheKey],
      queryFn: () => getParsedFileContents(serverHandle, 'server'),
    }),
    queryClient.prefetchQuery<FileSystemDirectoryHandle>({
      queryKey: [serverHandleCacheKey],
      queryFn: () => serverHandle,
    }),
    queryClient.prefetchQuery<Player[]>({
      queryKey: [playersCacheKey],
      queryFn: () => getParsedFileContents(serverHandle, 'players'),
    }),
    queryClient.prefetchQuery<Reputation[]>({
      queryKey: [reputationsCacheKey],
      queryFn: () => getParsedFileContents(serverHandle, 'reputations'),
    }),
    queryClient.prefetchQuery<Achievement[]>({
      queryKey: [achievementsCacheKey],
      queryFn: () => getParsedFileContents(serverHandle, 'achievements'),
    }),
    queryClient.prefetchQuery<Effect[]>({
      queryKey: [effectsCacheKey],
      queryFn: () => getParsedFileContents(serverHandle, 'effects'),
    }),
    queryClient.prefetchQuery<GameEvent[]>({
      queryKey: [eventsCacheKey],
      queryFn: () => getParsedFileContents(serverHandle, 'events'),
    }),
    queryClient.prefetchQuery<Hero>({
      queryKey: [heroCacheKey],
      queryFn: () => getParsedFileContents(serverHandle, 'hero'),
    }),
    queryClient.prefetchQuery<Tile[]>({
      queryKey: [mapCacheKey],
      queryFn: () => getParsedFileContents(serverHandle, 'map'),
    }),
    queryClient.prefetchQuery<Quest[]>({
      queryKey: [questsCacheKey],
      queryFn: () => getParsedFileContents(serverHandle, 'quests'),
    }),
    queryClient.prefetchQuery<Report[]>({
      queryKey: [reportsCacheKey],
      queryFn: () => getParsedFileContents(serverHandle, 'reports'),
    }),
    queryClient.prefetchQuery<Village[]>({
      queryKey: [villagesCacheKey],
      queryFn: () => getParsedFileContents(serverHandle, 'villages'),
    }),
    queryClient.prefetchQuery<MapFilters>({
      queryKey: [mapFiltersCacheKey],
      queryFn: () => getParsedFileContents(serverHandle, 'mapFilters'),
    }),
    queryClient.prefetchQuery<MapMarker[]>({
      queryKey: [mapMarkersCacheKey],
      queryFn: () => getParsedFileContents(serverHandle, 'mapMarkers'),
    }),
    queryClient.prefetchQuery<Troop[]>({
      queryKey: [troopsCacheKey],
      queryFn: () => getParsedFileContents(serverHandle, 'troops'),
    }),
  ]);

  return queryClient;
};

export const gameLoader: LoaderFunction<GameLoaderParams> = async ({ params }) => {
  const { serverSlug } = params as GameLoaderParams;

  const serverHandle = await getServerHandle(serverSlug);

  const currentServer: Server = await getParsedFileContents(serverHandle, 'server');

  if (!currentServer) {
    throw new MissingServerError(serverSlug);
  }

  const queryClient = await createHydratedGameQueryClient(serverHandle);

  return {
    resolved: true,
    dehydratedState: dehydrate(queryClient),
  };
};
