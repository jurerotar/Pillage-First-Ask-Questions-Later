import { worldItemsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { ApiHandler } from 'app/interfaces/api';
import type { WorldItem } from 'app/interfaces/models/game/world-item';

export const getWorldItems: ApiHandler<WorldItem[]> = async (queryClient) => {
  const worldItems = queryClient.getQueryData<WorldItem[]>([
    worldItemsCacheKey,
  ])!;

  return worldItems;
};
