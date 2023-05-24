import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { Hero } from 'interfaces/models/game/hero';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';

export const useHero = () => {
  const { serverId } = useCurrentServer();

  const {
    data: hero,
    isLoading: isLoadingHero,
    isSuccess: hasLoadedHero,
    status: heroQueryStatus
  } = useAsyncLiveQuery<Hero | undefined>(async () => {
    return database.heroes.where({ serverId }).first();
  }, [serverId]);

  return {
    hero,
    isLoadingHero,
    hasLoadedHero,
    heroQueryStatus
  };
};
