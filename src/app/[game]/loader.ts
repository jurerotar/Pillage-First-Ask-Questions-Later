import { achievementsCacheKey, getAchievements } from 'app/[game]/hooks/use-achievements';
import { effectsCacheKey, getEffects } from 'app/[game]/hooks/use-effects';
import { eventsCacheKey, getEvents } from 'app/[game]/hooks/use-events';
import { getHero, heroCacheKey } from 'app/[game]/hooks/use-hero';
import { getMap, mapCacheKey } from 'app/[game]/hooks/use-map';
import { getQuests, questsCacheKey } from 'app/[game]/hooks/use-quests';
import { getReports, reportsCacheKey } from 'app/[game]/hooks/use-reports';
import { getResearchLevels, researchLevelsCacheKey } from 'app/[game]/hooks/use-research-levels';
import { getVillages, villagesCacheKey } from 'app/[game]/hooks/use-villages';
import { currentServerCacheKey, getCurrentServer } from 'app/[game]/hooks/use-current-server';
import { Achievement } from 'interfaces/models/game/achievement';
import { Village } from 'interfaces/models/game/village';
import { Effect } from 'interfaces/models/game/effect';
import { Hero } from 'interfaces/models/game/hero';
import { Tile } from 'interfaces/models/game/tile';
import { Quest } from 'interfaces/models/game/quest';
import { ResearchLevel } from 'interfaces/models/game/research-level';
import { Server } from 'interfaces/models/game/server';
import { GameEvent } from 'interfaces/models/events/game-event';
import { Report } from 'interfaces/models/game/report';
import { LoaderFunction } from 'react-router-dom';
import { Player } from 'interfaces/models/game/player';
import { getPlayers, playersCacheKey } from 'app/[game]/hooks/use-players';
import { Reputation } from 'interfaces/models/game/reputation';
import { getReputations, reputationsCacheKey } from 'app/[game]/hooks/use-reputations';
import { getMapFilters, mapFiltersCacheKey } from 'app/[game]/[map]/hooks/use-map-filters';
import { MapFilters } from 'interfaces/models/game/map-filters';
import { dehydrate, QueryClient } from '@tanstack/react-query';
import { MapMarker } from 'interfaces/models/game/map-marker';
import { getMapMarkers, mapMarkersCacheKey } from 'app/[game]/[map]/hooks/use-map-markers';
import { database } from 'database/database';

// TODO: These imports should be lazy loaded

class MissingServerError extends Error {
  constructor(serverSlug: Server['slug']) {
    super();
    this.name = 'MissingServerError';
    this.message = `Server with slug "${serverSlug}" does not exist. If you're accessing this server from an url, try accessing the server from the homepage, to make sure the server still exists.`;
  }
}

class MissingVillageError extends Error {
  constructor(serverSlug: Server['slug'], villageSlug: Village['slug']) {
    super();
    this.name = 'MissingVillageError';
    this.message = `No valid villages found for slug ${villageSlug}. Recheck if the path is correct and manually change it to /${serverSlug}/v-1 if not.`;
  }
}

type GameLoaderParams = Record<'serverSlug' | 'villageSlug', string>;

export const gameLoader: LoaderFunction<GameLoaderParams> = async ({ params }) => {
  const { serverSlug, villageSlug } = params as GameLoaderParams;

  const queryClient = new QueryClient();

  const currentServer: Server | undefined = await getCurrentServer(serverSlug);

  if (!currentServer) {
    throw new MissingServerError(serverSlug);
  }

  queryClient.setQueryData<Server>([currentServerCacheKey, serverSlug], currentServer);

  const { id: serverId } = currentServer;

  const currentVillage: Village | undefined = await database.villages.where({ serverId, slug: villageSlug }).first();

  if (!currentVillage) {
    throw new MissingVillageError(serverSlug, villageSlug);
  }

  // Cache hydration
  await Promise.allSettled([
    queryClient.prefetchQuery<Player[]>({
      queryKey: [playersCacheKey, serverId],
      queryFn: () => getPlayers(serverId),
    }),
    queryClient.prefetchQuery<Reputation[]>({
      queryKey: [reputationsCacheKey, serverId],
      queryFn: () => getReputations(serverId),
    }),
    queryClient.prefetchQuery<Achievement[]>({
      queryKey: [achievementsCacheKey, serverId],
      queryFn: () => getAchievements(serverId),
    }),
    queryClient.prefetchQuery<Effect[]>({
      queryKey: [effectsCacheKey, serverId],
      queryFn: () => getEffects(serverId),
    }),
    queryClient.prefetchQuery<GameEvent[]>({
      queryKey: [eventsCacheKey, serverId],
      queryFn: () => getEvents(serverId),
    }),
    queryClient.prefetchQuery<Hero>({
      queryKey: [heroCacheKey, serverId],
      queryFn: () => getHero(serverId),
    }),
    queryClient.prefetchQuery<Tile[]>({
      queryKey: [mapCacheKey, serverId],
      queryFn: () => getMap(serverId),
    }),
    queryClient.prefetchQuery<Quest[]>({
      queryKey: [questsCacheKey, serverId],
      queryFn: () => getQuests(serverId),
    }),
    queryClient.prefetchQuery<Report[]>({
      queryKey: [reportsCacheKey, serverId],
      queryFn: () => getReports(serverId),
    }),
    queryClient.prefetchQuery<ResearchLevel[]>({
      queryKey: [researchLevelsCacheKey, serverId],
      queryFn: () => getResearchLevels(serverId),
    }),
    queryClient.prefetchQuery<Village[]>({
      queryKey: [villagesCacheKey, serverId],
      queryFn: () => getVillages(serverId),
    }),
    queryClient.prefetchQuery<MapFilters>({
      queryKey: [mapFiltersCacheKey, serverId],
      queryFn: () => getMapFilters(serverId),
    }),
    queryClient.prefetchQuery<MapMarker[]>({
      queryKey: [mapMarkersCacheKey, serverId],
      queryFn: () => getMapMarkers(serverId),
    }),
  ]);

  return {
    resolved: true,
    dehydratedState: dehydrate(queryClient),
  };
};
