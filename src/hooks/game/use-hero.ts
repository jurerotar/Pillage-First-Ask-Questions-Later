import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { Hero } from 'interfaces/models/game/hero';
import { useQuery } from '@tanstack/react-query';
import { Server } from 'interfaces/models/game/server';

export const heroCacheKey = 'hero';

export const getHero = (serverId: Server['id']) => (database.heroes.where({ serverId }).first() as Promise<Hero>);

export const useHero = () => {
  const { serverId } = useCurrentServer();

  const {
    data,
    isLoading: isLoadingHero,
    isSuccess: hasLoadedHero,
    status: heroQueryStatus,
  } = useQuery<Hero>({
    queryFn: () => getHero(serverId),
    queryKey: [heroCacheKey, serverId],
  });

  // Due to us working with only local data, which is prefetched in loader, we can do this assertion to save us from having to spam "!" everywhere
  const hero = data as Hero;

  return {
    hero,
    isLoadingHero,
    hasLoadedHero,
    heroQueryStatus,
  };
};
