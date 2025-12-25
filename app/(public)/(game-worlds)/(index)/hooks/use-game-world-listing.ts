import { useQuery } from '@tanstack/react-query';
import { availableServerCacheKey } from 'app/(public)/constants/query-keys';
import type { Server } from 'app/interfaces/models/game/server';

export const useGameWorldListing = () => {
  const { data: gameWorldListing } = useQuery<Server[]>({
    queryKey: [availableServerCacheKey],
    queryFn: async () => {
      return JSON.parse(
        window.localStorage.getItem(availableServerCacheKey) ?? '[]',
      );
    },
    initialData: [],
  });

  return {
    gameWorldListing,
  };
};
