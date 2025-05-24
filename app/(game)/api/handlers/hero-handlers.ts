import type { ApiHandler } from 'app/interfaces/api';
import { adventurePointsCacheKey, heroCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { Hero } from 'app/interfaces/models/game/hero';
import type { AdventurePoints } from 'app/interfaces/models/game/adventure-points';

export const getHero: ApiHandler<Hero> = async (queryClient) => {
  return queryClient.getQueryData<Hero>([heroCacheKey])!;
};

export const getAdventurePoints: ApiHandler<AdventurePoints> = async (queryClient) => {
  return queryClient.getQueryData<AdventurePoints>([adventurePointsCacheKey])!;
};
