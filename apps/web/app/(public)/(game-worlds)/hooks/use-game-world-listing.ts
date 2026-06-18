import { useQuery } from '@tanstack/react-query';
import type { Server } from '@pillage-first/types/models/server';
import { availableServerCacheKey } from 'app/(public)/constants/query-keys';

const getGameWorldListing = (): Server[] => {
  try {
    return JSON.parse(
      window.localStorage.getItem(availableServerCacheKey) ?? '[]',
    );
  } catch {
    return [];
  }
};

export const useGameWorldListing = () => {
  const { data: gameWorldListing } = useQuery<Server[]>({
    queryKey: [availableServerCacheKey],
    queryFn: async () => getGameWorldListing(),
    initialData: [],
  });

  return {
    gameWorldListing,
  };
};
