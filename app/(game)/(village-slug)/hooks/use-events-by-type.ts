import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import type {
  GameEvent,
  GameEventType,
} from 'app/interfaces/models/game/game-event';
import { eventsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

export const useEventsByType = <T extends GameEventType>(eventType: T) => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: eventsByType } = useSuspenseQuery<GameEvent<T>[]>({
    queryKey: [eventsCacheKey, eventType, currentVillage.id],
    queryFn: async () => {
      const { data } = await fetcher<GameEvent<T>[]>(
        `/villages/${currentVillage.id}/events/${eventType}`,
      );
      return data;
    },
  });

  const hasEvents = eventsByType.length > 0;

  return {
    eventsByType,
    hasEvents,
  };
};
