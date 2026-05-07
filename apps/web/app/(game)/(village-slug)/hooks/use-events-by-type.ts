import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type {
  GameEvent,
  GameEventType,
} from '@pillage-first/types/models/game-event';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { eventsCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useEventsByType = <T extends GameEventType>(eventType: T) => {
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: eventsByType } = useSuspenseQuery({
    queryKey: [eventsCacheKey, eventType, currentVillage.id],
    queryFn: async () => {
      const { data } = await apiClient.get(
        '/villages/:villageId/events/:eventType',
        {
          path: {
            villageId: currentVillage.id,
            eventType,
          },
        },
      );

      return data as GameEvent<Extract<T, GameEventType>>[];
    },
  });

  const hasEvents = eventsByType.length > 0;

  return {
    eventsByType: eventsByType,
    hasEvents,
  };
};
