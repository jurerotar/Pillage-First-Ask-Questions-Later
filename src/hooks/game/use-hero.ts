import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { Hero } from 'interfaces/models/game/hero';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';
import { useDatabaseMutation } from 'hooks/database/use-database-mutation';

const cacheKey = 'hero';

export const useHero = () => {
  const { serverId, hasLoadedServer } = useCurrentServer();
  const { mutate: mutateHero } = useDatabaseMutation({ cacheKey });

  const {
    data: hero,
    isLoading: isLoadingHero,
    isSuccess: hasLoadedHero,
    status: heroQueryStatus
  } = useAsyncLiveQuery<Hero | undefined>({
    queryFn: () => database.heroes.where({ serverId }).first(),
    deps: [serverId],
    cacheKey,
    enabled: hasLoadedServer
  });

  console.log();

  return {
    hero,
    isLoadingHero,
    hasLoadedHero,
    heroQueryStatus
  };
};
