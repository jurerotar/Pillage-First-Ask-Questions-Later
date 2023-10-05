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
import { CacheHydrationError, MissingServerError } from 'utils/errors';
import { LoaderFunction } from 'react-router-dom';

type GameLoaderParams = Record<'serverSlug' | 'villageSlug', string>;

const promiseErrorFunction = (resolvedPromise: PromiseSettledResult<unknown>) => resolvedPromise.status === 'rejected' || resolvedPromise?.value === undefined;

export const gameLoader: LoaderFunction<GameLoaderParams> = async ({ params }) => {
  const { serverSlug } = params as GameLoaderParams;
  const currentServer = await getAndSetCacheData<Server | undefined>(currentServerCacheKey, () => getCurrentServer(serverSlug));

  if (!currentServer) {
    throw new MissingServerError(serverSlug);
  }

  const serverId = currentServer.id!;

  // TODO: Check if village from url exists
  const currentVillage = getAndSetCacheData<Village | undefined>(currentVillageCacheKey, () => getCurrentVillage(serverId, 'v-1'));

  // Cache hydration
  const resolvedPromises = await Promise.allSettled([
    getAndSetCacheData<Achievement[]>(achievementsCacheKey, () => getAchievements(serverId)),
    getAndSetCacheData<Bank | undefined>(banksCacheKey, () => getBank(serverId)),
    getAndSetCacheData<Effect[]>(effectsCacheKey, () => getEffects(serverId)),
    getAndSetCacheData<GameEvent[]>(eventsCacheKey, () => getEvents(serverId)),
    getAndSetCacheData<Hero | undefined>(heroCacheKey, () => getHero(serverId)),
    getAndSetCacheData<Tile[]>(mapCacheKey, () => getMap(serverId)),
    getAndSetCacheData<Quest[]>(questsCacheKey, () => getQuests(serverId)),
    getAndSetCacheData<Report[]>(reportsCacheKey, () => getReports(serverId)),
    getAndSetCacheData<ResearchLevel[]>(researchLevelsCacheKey, () => getResearchLevels(serverId)),
    getAndSetCacheData<Village[]>(villagesCacheKey, () => getVillages(serverId))
  ]);

  const hasHydrationErrorOccurred = resolvedPromises.some(promiseErrorFunction);

  if (hasHydrationErrorOccurred) {
    throw new CacheHydrationError(serverId);
  }

  return {
    resolved: true
  };
};
