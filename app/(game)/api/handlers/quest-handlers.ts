import type { ApiHandler } from 'app/interfaces/api';
import { questsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { Quest } from 'app/interfaces/models/game/quest';

export const getQuests: ApiHandler<Quest[]> = async (queryClient) => {
  return queryClient.getQueryData<Quest[]>([questsCacheKey])!;
};
