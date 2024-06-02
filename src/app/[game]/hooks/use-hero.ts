import { useQuery } from '@tanstack/react-query';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import type { Hero } from 'interfaces/models/game/hero';
import { getParsedFileContents } from 'app/utils/opfs';

export const heroCacheKey = 'hero';

export const useHero = () => {
  const { serverHandle } = useCurrentServer();

  const { data } = useQuery<Hero>({
    queryFn: () => getParsedFileContents(serverHandle, 'hero'),
    queryKey: [heroCacheKey],
  });

  // Due to us working with only local data, which is prefetched in loader, we can do this assertion to save us from having to spam "!" everywhere
  const hero = data as Hero;

  return {
    hero,
  };
};
