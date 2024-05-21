import { QueryClient, dehydrate } from '@tanstack/react-query';
import { getMapFilters, mapFiltersCacheKey } from 'app/[game]/[map]/hooks/use-map-filters';
import { getMapMarkers, mapMarkersCacheKey } from 'app/[game]/[map]/hooks/use-map-markers';
import { achievementsCacheKey, getAchievements } from 'app/[game]/hooks/use-achievements';
import { currentServerCacheKey, getCurrentServer } from 'app/[game]/hooks/use-current-server';
import { effectsCacheKey, getEffects } from 'app/[game]/hooks/use-effects';
import { eventsCacheKey, getEvents } from 'app/[game]/hooks/use-events';
import { getHero, heroCacheKey } from 'app/[game]/hooks/use-hero';
import { getMap, mapCacheKey } from 'app/[game]/hooks/use-map';
import { getPlayers, playersCacheKey } from 'app/[game]/hooks/use-players';
import { getQuests, questsCacheKey } from 'app/[game]/hooks/use-quests';
import { getReports, reportsCacheKey } from 'app/[game]/hooks/use-reports';
import { getReputations, reputationsCacheKey } from 'app/[game]/hooks/use-reputations';
import { getResearchLevels, researchLevelsCacheKey } from 'app/[game]/hooks/use-research-levels';
import { getTroops, troopsCacheKey } from 'app/[game]/hooks/use-troops';
import { getVillages, villagesCacheKey } from 'app/[game]/hooks/use-villages';
import { database } from 'database/database';
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
import type { ResearchLevel } from 'interfaces/models/game/research-level';
import type { Server } from 'interfaces/models/game/server';
import type { Tile } from 'interfaces/models/game/tile';
import type { Troop } from 'interfaces/models/game/troop';
import type { Village } from 'interfaces/models/game/village';
import type { LoaderFunction } from 'react-router-dom';

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
    queryClient.prefetchQuery<Troop[]>({
      queryKey: [troopsCacheKey, serverId],
      queryFn: () => getTroops(serverId),
    }),
  ]);

  return {
    resolved: true,
    dehydratedState: dehydrate(queryClient),
  };
};
