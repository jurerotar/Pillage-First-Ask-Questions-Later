import type { ApiHandler } from 'app/interfaces/api';
import { troopsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { Troop } from 'app/interfaces/models/game/troop';

export const getTroops: ApiHandler<Troop[]> = async (
  queryClient,
  _database,
) => {
  return queryClient.getQueryData<Troop[]>([troopsCacheKey])!;
};
