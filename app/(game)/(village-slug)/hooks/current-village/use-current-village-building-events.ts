import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { isBuildingEvent } from 'app/(game)/(village-slug)/hooks/guards/event-guards';
import { useEvents } from 'app/(game)/(village-slug)/hooks/use-events';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useQuery } from '@tanstack/react-query';
import { nonPersistedCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

export const useCurrentVillageBuildingEvents = () => {
  const { currentVillage } = useCurrentVillage();
  const { events } = useEvents();

  const getCurrentVillageBuildingEvents = (): GameEvent<'buildingConstruction'>[] => {
    return events.filter((event) => isBuildingEvent(event) && event.villageId === currentVillage.id) as GameEvent<'buildingConstruction'>[];
  };

  const { data: currentVillageBuildingEvents } = useQuery<GameEvent<'buildingConstruction'>[]>({
    queryKey: [nonPersistedCacheKey, 'current-village-building-events', events],
    queryFn: getCurrentVillageBuildingEvents,
    initialData: getCurrentVillageBuildingEvents,
    initialDataUpdatedAt: Date.now(),
    gcTime: 10_000,
    queryKeyHashFn: () => {
      const eventHash = events.map((event) => event.id).join('|');
      return `${nonPersistedCacheKey}-current-village-building-events-${eventHash}`;
    },
  });

  return {
    currentVillageBuildingEvents,
  };
};
