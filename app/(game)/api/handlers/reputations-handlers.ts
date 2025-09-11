import type { ApiHandler } from 'app/interfaces/api';
import type { Reputation } from 'app/interfaces/models/game/reputation';

export const getReputations: ApiHandler<Reputation[]> = async (
  _queryClient,
  _database,
) => {
  return [];
};
