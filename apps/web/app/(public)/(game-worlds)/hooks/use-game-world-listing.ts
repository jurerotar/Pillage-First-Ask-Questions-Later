import { useQuery } from '@tanstack/react-query';
import type { Server } from '@pillage-first/types/models/server';
import {
  getGameWorldListing,
  getPinnedServerIds,
} from 'app/(public)/(game-worlds)/utils/game-world-listing';
import { availableServerCacheKey } from 'app/(public)/constants/query-keys';

export const useGameWorldListing = () => {
  const { data: gameWorldListing } = useQuery<Server[]>({
    queryKey: [availableServerCacheKey],
    queryFn: getGameWorldListing,
    initialData: [],
  });

  return {
    gameWorldListing,
    pinnedServerIds: getPinnedServerIds(),
  };
};
