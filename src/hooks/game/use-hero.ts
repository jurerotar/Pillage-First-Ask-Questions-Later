import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { Hero } from 'interfaces/models/game/hero';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';
import { useDatabaseMutation } from 'hooks/database/use-database-mutation';
import { Server } from 'interfaces/models/game/server';

export const heroCacheKey = 'hero';

export const getHero = (serverId: Server['id']) => database.heroes.where({ serverId }).first();

export const useHero = () => {
  const { serverId, hasLoadedServer } = useCurrentServer();
  const { mutate: mutateHero } = useDatabaseMutation({ cacheKey: heroCacheKey });

  const {
    data: hero,
    isLoading: isLoadingHero,
    isSuccess: hasLoadedHero,
    status: heroQueryStatus
  } = useAsyncLiveQuery<Hero | undefined>({
    queryFn: () => getHero(serverId),
    deps: [serverId],
    cacheKey: heroCacheKey,
    enabled: hasLoadedServer
  });

  return {
    hero,
    isLoadingHero,
    hasLoadedHero,
    heroQueryStatus
  };
};
