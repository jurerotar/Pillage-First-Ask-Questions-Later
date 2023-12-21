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
import { getAndSetCacheData } from 'database/cache';
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

class CacheHydrationError extends Error {
  constructor(serverId: Server['id']) {
    super();
    this.name = 'CacheHydrationError';
    this.message = `One or more database entries are missing for server with id: ${serverId}.`;
  }
}

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

const promiseErrorFunction = (resolvedPromise: PromiseSettledResult<unknown>) => resolvedPromise.status === 'rejected' || resolvedPromise?.value === undefined;

export const gameLoader: LoaderFunction<GameLoaderParams> = async ({ params }) => {
  const { serverSlug, villageSlug } = params as GameLoaderParams;
  const currentServer = await getAndSetCacheData<Server | undefined>(currentServerCacheKey, () => getCurrentServer(serverSlug));

  if (!currentServer) {
    throw new MissingServerError(serverSlug);
  }

  const serverId = currentServer.id!;

  const currentVillage = await getAndSetCacheData<Village | undefined>(currentVillageCacheKey, () => getCurrentVillage(serverId, villageSlug));

  if (!currentVillage) {
    throw new MissingVillageError(serverSlug, villageSlug);
  }

  // Cache hydration
  const resolvedPromises = await Promise.allSettled([
    getAndSetCacheData<Player[]>(playersCacheKey, () => getPlayers(serverId)),
    getAndSetCacheData<Reputation[]>(reputationsCacheKey, () => getReputations(serverId)),
    getAndSetCacheData<Achievement[]>(achievementsCacheKey, () => getAchievements(serverId)),
    getAndSetCacheData<Bank | undefined>(banksCacheKey, () => getBank(serverId)),
    getAndSetCacheData<Effect[]>(effectsCacheKey, () => getEffects(serverId)),
    getAndSetCacheData<GameEvent[]>(eventsCacheKey, () => getEvents(serverId)),
    getAndSetCacheData<Hero | undefined>(heroCacheKey, () => getHero(serverId)),
    getAndSetCacheData<Tile[]>(mapCacheKey, () => getMap(serverId)),
    getAndSetCacheData<Quest[]>(questsCacheKey, () => getQuests(serverId)),
    getAndSetCacheData<Report[]>(reportsCacheKey, () => getReports(serverId)),
    getAndSetCacheData<ResearchLevel[]>(researchLevelsCacheKey, () => getResearchLevels(serverId)),
    getAndSetCacheData<Village[]>(villagesCacheKey, () => getVillages(serverId)),
    getAndSetCacheData<MapFilters>(mapFiltersCacheKey, () => getMapFilters(serverId)),
  ]);

  const hasHydrationErrorOccurred = resolvedPromises.some(promiseErrorFunction);

  if (hasHydrationErrorOccurred) {
    throw new CacheHydrationError(serverId);
  }

  return {
    resolved: true,
  };
};
