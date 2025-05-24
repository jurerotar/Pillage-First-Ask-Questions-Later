import type { ApiHandler } from 'app/interfaces/api';
import type { Tile } from 'app/interfaces/models/game/tile';
import { mapCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

export const getMap: ApiHandler<Tile[]> = async (queryClient) => {
  return queryClient.getQueryData<Tile[]>([mapCacheKey])!;
};
