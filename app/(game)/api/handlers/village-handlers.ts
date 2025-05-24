import type { ApiHandler } from 'app/interfaces/api';
import { villagesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { Village } from 'app/interfaces/models/game/village';

export const getVillages: ApiHandler<Village[]> = async (queryClient) => {
  const villages = queryClient.getQueryData<Village[]>([villagesCacheKey])!;

  return villages;
};
