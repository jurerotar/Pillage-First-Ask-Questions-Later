import { achievementsCacheKey, getAchievements } from 'hooks/game/use-achievements';
import { banksCacheKey, getBank } from 'hooks/game/use-bank';
import { currentVillageCacheKey, getCurrentVillage } from 'hooks/game/use-current-village';
import { effectsCacheKey, getEffects } from 'hooks/game/use-effects';
import { eventsCacheKey, getEvents } from 'hooks/game/use-events';
import { getHero, heroCacheKey } from 'hooks/game/use-hero';
import { getMap, mapCacheKey } from 'hooks/game/use-map';
import { getQuests, questsCacheKey } from 'hooks/game/use-quests';
import { getReports, reportsCacheKey } from 'hooks/game/use-reports';
import { getResearchLevels, researchLevelsCacheKey } from 'hooks/game/use-research-levels';
import { getVillages, villagesCacheKey } from 'hooks/game/use-villages';
import { currentServerCacheKey, getCurrentServer } from 'hooks/game/use-current-server';
import { Achievement } from 'interfaces/models/game/achievement';
import { Bank } from 'interfaces/models/game/bank';
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
import { getPlayers, playersCacheKey } from 'hooks/game/use-players';
import { Reputation } from 'interfaces/models/game/reputation';
import { getReputations, reputationsCacheKey } from 'hooks/game/use-reputations';
import { getMapFilters, mapFiltersCacheKey } from 'hooks/game/preferences/use-map-filters';
import { MapFilters } from 'interfaces/models/game/preferences/map-filters';
import { dehydrate, QueryClient } from '@tanstack/react-query';

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
  const {
    serverSlug,
    villageSlug
  } = params as GameLoaderParams;

  const queryClient = new QueryClient();

  const currentServer: Server | undefined = await getCurrentServer(serverSlug);

  if (!currentServer) {
    throw new MissingServerError(serverSlug);
  }

  queryClient.setQueryData<Server>([currentServerCacheKey, serverSlug], currentServer);

  const { id: serverId } = currentServer;

  const currentVillage: Village | undefined = await getCurrentVillage(serverId, villageSlug);

  if (!currentVillage) {
    throw new MissingVillageError(serverSlug, villageSlug);
  }

  queryClient.setQueryData<Village>([currentVillageCacheKey, serverId, villageSlug], currentVillage);

  // Cache hydration
  await Promise.allSettled([
    queryClient.prefetchQuery<Player[]>({
      queryKey: [playersCacheKey, serverId],
      queryFn: () => getPlayers(serverId)
    }),
    queryClient.prefetchQuery<Reputation[]>({
      queryKey: [reputationsCacheKey, serverId],
      queryFn: () => getReputations(serverId)
    }),
    queryClient.prefetchQuery<Achievement[]>({
      queryKey: [achievementsCacheKey, serverId],
      queryFn: () => getAchievements(serverId)
    }),
    queryClient.prefetchQuery<Bank>({
      queryKey: [banksCacheKey, serverId],
      queryFn: () => getBank(serverId)
    }),
    queryClient.prefetchQuery<Effect[]>({
      queryKey: [effectsCacheKey, serverId],
      queryFn: () => getEffects(serverId)
    }),
    queryClient.prefetchQuery<GameEvent[]>({
      queryKey: [eventsCacheKey, serverId],
      queryFn: () => getEvents(serverId)
    }),
    queryClient.prefetchQuery<Hero>({
      queryKey: [heroCacheKey, serverId],
      queryFn: () => getHero(serverId)
    }),
    queryClient.prefetchQuery<Tile[]>({
      queryKey: [mapCacheKey, serverId],
      queryFn: () => getMap(serverId)
    }),
    queryClient.prefetchQuery<Quest[]>({
      queryKey: [questsCacheKey, serverId],
      queryFn: () => getQuests(serverId)
    }),
    queryClient.prefetchQuery<Report[]>({
      queryKey: [reportsCacheKey, serverId],
      queryFn: () => getReports(serverId)
    }),
    queryClient.prefetchQuery<ResearchLevel[]>({
      queryKey: [researchLevelsCacheKey, serverId],
      queryFn: () => getResearchLevels(serverId)
    }),
    queryClient.prefetchQuery<Village[]>({
      queryKey: [villagesCacheKey, serverId],
      queryFn: () => getVillages(serverId)
    }),
    queryClient.prefetchQuery<MapFilters>({
      queryKey: [mapFiltersCacheKey, serverId],
      queryFn: () => getMapFilters(serverId)
    })
  ]);

  return {
    resolved: true,
    dehydratedState: dehydrate(queryClient),
  };
};
