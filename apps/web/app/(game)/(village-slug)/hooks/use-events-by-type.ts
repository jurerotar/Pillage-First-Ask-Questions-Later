import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type {
  GameEvent,
  GameEventType,
  TroopMovementEvent,
} from '@pillage-first/types/models/game-event';
import { eventsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { ApiContext } from 'app/(game)/providers/api-provider';

// `troopMovement` is a special type that selects all troopMovement events
export const useEventsByType = <T extends GameEventType | 'troopMovement'>(
  eventType: T,
) => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: eventsByType } = useSuspenseQuery({
    queryKey: [eventsCacheKey, eventType, currentVillage.id],
    queryFn: async () => {
      const { data } = await fetcher<
        T extends 'troopMovement'
          ? TroopMovementEvent[]
          : GameEvent<Extract<T, GameEventType>>[]
      >(`/villages/${currentVillage.id}/events/${eventType}`);
      return data;
    },
  });

  const hasEvents =
    (eventsByType as (GameEvent | TroopMovementEvent)[]).length > 0;

  return {
    eventsByType: eventsByType,
    hasEvents,
  };
};
