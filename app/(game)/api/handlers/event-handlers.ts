import type { ApiHandler } from 'app/interfaces/api';
import { eventsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { GameEvent } from 'app/interfaces/models/game/game-event';

export const getEvents: ApiHandler<GameEvent[]> = async (queryClient) => {
  return queryClient.getQueryData<GameEvent[]>([eventsCacheKey])!;
};
