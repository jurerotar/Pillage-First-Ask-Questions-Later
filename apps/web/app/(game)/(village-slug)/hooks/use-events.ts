import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { eventsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useEvents = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: events } = useSuspenseQuery({
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
