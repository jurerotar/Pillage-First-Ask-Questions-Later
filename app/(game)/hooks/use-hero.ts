import { useQuery } from '@tanstack/react-query';
import type { Hero } from 'app/interfaces/models/game/hero';
import { heroCacheKey } from 'app/(game)/constants/query-keys';

export const useHero = () => {
  const { data } = useQuery<Hero>({
    queryKey: [heroCacheKey],
  });

  const hero = data as Hero;

  return {
    hero,
  };
};
