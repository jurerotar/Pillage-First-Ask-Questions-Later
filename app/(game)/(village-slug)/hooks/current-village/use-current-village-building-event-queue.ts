import type { BuildingField } from 'app/interfaces/models/game/village';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { useMemo } from 'react';
import { partition } from 'app/utils/common';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { useCurrentVillageBuildingEvents } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village-building-events';

// TODO: Raise this to 5 once you figure out how to solve the scheduledBuildingEvent bug
const MAX_BUILDINGS_IN_QUEUE = 1;

export const useCurrentVillageBuildingEventQueue = (buildingFieldId: BuildingField['id']) => {
  const { tribe } = useTribe();
  const { currentVillageBuildingEvents } = useCurrentVillageBuildingEvents();

  // Returns building event queue for specific village. Makes sure you get the correct queue in case of roman tribe, since they have 2
  const currentVillageBuildingEventsQueue = useMemo(() => {
    if (tribe !== 'romans') {
      return currentVillageBuildingEvents;
    }

    const [resourceQueue, villageQueue] = partition<GameEvent<'buildingLevelChange'>>(
      currentVillageBuildingEvents,
      (event) => event.buildingFieldId <= 18,
    );

    return buildingFieldId <= 18 ? resourceQueue : villageQueue;
  }, [tribe, buildingFieldId, currentVillageBuildingEvents]);

  const canAddAdditionalBuildingToQueue = currentVillageBuildingEventsQueue.length < MAX_BUILDINGS_IN_QUEUE;

  return {
    currentVillageBuildingEventsQueue,
    canAddAdditionalBuildingToQueue,
  };
};
