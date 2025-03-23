import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { isBuildingEvent } from 'app/(game)/hooks/guards/event-guards';
import { useEvents } from 'app/(game)/hooks/use-events';
import { use } from 'react';
import { CurrentVillageContext } from 'app/(game)/providers/current-village-provider';
import { useQuery } from '@tanstack/react-query';
import { nonPersistedCacheKey } from 'app/(game)/constants/query-keys';

export const useCurrentVillageBuildingEvents = () => {
  const { currentVillage } = use(CurrentVillageContext);
  const { events } = useEvents();

  const getCurrentVillageBuildingEvents = (): GameEvent<'buildingConstruction'>[] => {
    return events.filter((event) => isBuildingEvent(event) && event.villageId === currentVillage.id) as GameEvent<'buildingConstruction'>[];
  };

  const { data: currentVillageBuildingEvents } = useQuery<GameEvent<'buildingConstruction'>[]>({
    queryKey: [nonPersistedCacheKey, events],
    queryFn: getCurrentVillageBuildingEvents,
    initialData: getCurrentVillageBuildingEvents,
    initialDataUpdatedAt: Date.now(),
    queryKeyHashFn: () => {
      const eventHash = events.map((event) => event.id).join('|');
      return `${nonPersistedCacheKey}-${eventHash}`;
    },
  });

  return {
    currentVillageBuildingEvents,
  };
};
