import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { eventsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { ApiContext } from 'app/(game)/providers/api-provider';
import type { GameEvent } from 'app/interfaces/models/game/game-event';

export const useEvents = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: events } = useSuspenseQuery<GameEvent[]>({
    queryKey: [eventsCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await fetcher<GameEvent[]>(
        `/villages/${currentVillage.id}/events`,
      );
      return data;
    },
  });

  return {
    events,
  };
};
