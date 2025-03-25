import type { BuildingField } from 'app/interfaces/models/game/village';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { partition } from 'app/utils/common';
import { useQuery } from '@tanstack/react-query';
import { nonPersistedCacheKey } from 'app/(game)/constants/query-keys';
import { useTribe } from 'app/(game)/hooks/use-tribe';
import { useCurrentVillageBuildingEvents } from 'app/(game)/hooks/current-village/use-current-village-building-events';

// TODO: Raise this to 5 once you figure out how to solve the scheduledBuildingEvent bug
const MAX_BUILDINGS_IN_QUEUE = 1;

export const useCurrentVillageBuildingEventQueue = (buildingFieldId: BuildingField['id']) => {
  const { tribe } = useTribe();
  const { currentVillageBuildingEvents } = useCurrentVillageBuildingEvents();

  // Returns building event queue for specific village. Makes sure you get the correct queue in case of roman tribe, since they have 2
  const getCurrentVillageBuildingEventsQueue = () => {
    if (tribe !== 'romans') {
      return currentVillageBuildingEvents;
    }

    const [resourceQueue, villageQueue] = partition<GameEvent<'buildingLevelChange'>>(
      currentVillageBuildingEvents,
      (event) => event.buildingFieldId <= 18,
    );

    if (buildingFieldId <= 18) {
      return resourceQueue;
    }

    return villageQueue;
  };

  const { data: currentVillageBuildingEventsQueue } = useQuery<GameEvent<'buildingConstruction'>[]>({
    queryKey: [nonPersistedCacheKey, 'current-village-building-events-queue', currentVillageBuildingEvents, buildingFieldId],
    queryFn: getCurrentVillageBuildingEventsQueue,
    initialData: getCurrentVillageBuildingEventsQueue,
    initialDataUpdatedAt: Date.now(),
    queryKeyHashFn: () => {
      const eventHash = currentVillageBuildingEvents.map((event) => event.id).join('|');
      return `current-village-building-events-queue-${nonPersistedCacheKey}-${eventHash}`;
    },
  });

  const canAddAdditionalBuildingToQueue = currentVillageBuildingEventsQueue.length < MAX_BUILDINGS_IN_QUEUE;

  return {
    currentVillageBuildingEventsQueue,
    canAddAdditionalBuildingToQueue,
  };
};
