import { useQuery } from '@tanstack/react-query';
import { getGameWorldListing } from 'app/(public)/(game-worlds)/utils/game-world-listing';
import { availableServerCacheKey } from 'app/(public)/constants/query-keys';

export const useGameWorldListing = () => {
  const { data: gameWorldListing } = useQuery({
    queryKey: [availableServerCacheKey],
    queryFn: getGameWorldListing,
    initialData: [],
  });

  return {
    gameWorldListing,
  };
};
