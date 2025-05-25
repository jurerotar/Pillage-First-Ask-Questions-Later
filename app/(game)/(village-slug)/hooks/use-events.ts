import { useSuspenseQuery } from '@tanstack/react-query';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { eventsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useEvents = () => {
  const { fetcher } = use(ApiContext);

  const { data: events } = useSuspenseQuery<GameEvent[]>({
    queryKey: [eventsCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<GameEvent[]>('/events');
      return data;
    },
  });

  return {
    events,
  };
};
