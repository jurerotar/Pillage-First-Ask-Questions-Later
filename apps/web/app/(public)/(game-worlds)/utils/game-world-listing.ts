import type { Server } from '@pillage-first/types/models/server';
import { availableServerCacheKey } from 'app/(public)/constants/query-keys';

export const getGameWorldListing = (): Server[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    return JSON.parse(
      window.localStorage.getItem(availableServerCacheKey) ?? '[]',
    );
  } catch {
    return [];
  }
};
