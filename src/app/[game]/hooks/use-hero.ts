import { useQuery } from '@tanstack/react-query';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import { database } from 'database/database';
import type { Hero } from 'interfaces/models/game/hero';
import type { Server } from 'interfaces/models/game/server';

export const heroCacheKey = 'hero';

export const getHero = (serverId: Server['id']) => database.heroes.where({ serverId }).first() as Promise<Hero>;

export const useHero = () => {
  const { serverId } = useCurrentServer();

  const { data } = useQuery<Hero>({
    queryFn: () => getHero(serverId),
    queryKey: [heroCacheKey, serverId],
  });

  // Due to us working with only local data, which is prefetched in loader, we can do this assertion to save us from having to spam "!" everywhere
  const hero = data as Hero;

  return {
    hero,
  };
};
