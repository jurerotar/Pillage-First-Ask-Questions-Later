import type { ApiHandler } from 'app/interfaces/api';
import { effectsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { Effect } from 'app/interfaces/models/game/effect';

export const getEffects: ApiHandler<Effect[]> = async (queryClient) => {
  return queryClient.getQueryData<Effect[]>([effectsCacheKey])!;
};
