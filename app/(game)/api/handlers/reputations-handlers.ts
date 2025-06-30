import type { ApiHandler } from 'app/interfaces/api';
import { reputationsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { Reputation } from 'app/interfaces/models/game/reputation';

export const getReputations: ApiHandler<Reputation[]> = async (queryClient) => {
  const reputations = queryClient.getQueryData<Reputation[]>([
    reputationsCacheKey,
  ])!;

  return reputations;
};
