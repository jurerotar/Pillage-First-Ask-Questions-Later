import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useMemo,
} from 'react';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import type { BuildingEvent } from '@pillage-first/types/models/game-event';
import { partition } from '@pillage-first/utils/array';
import { useCurrentVillageBuildingEvents } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village-building-events';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';

type CurrentVillageBuildingQueueContextReturn = {
  currentVillageBuildingEvents: BuildingEvent[];
  getBuildingEventQueue: (
    buildingFieldId: BuildingField['id'],
  ) => BuildingEvent[];
};

export const CurrentVillageBuildingQueueContext =
  createContext<CurrentVillageBuildingQueueContextReturn>(
    {} as CurrentVillageBuildingQueueContextReturn,
  );

export const CurrentVillageBuildingQueueContextProvider = ({
  children,
}: PropsWithChildren) => {
  const tribe = useTribe();
  const { currentVillageBuildingEvents } = useCurrentVillageBuildingEvents();

  const buildingEventQueues = useMemo(() => {
    const [resourceQueue, villageQueue] = partition<BuildingEvent>(
      currentVillageBuildingEvents,
      (event) => event.buildingFieldId <= 18,
    );

    return {
      resourceQueue,
      villageQueue,
    };
  }, [currentVillageBuildingEvents]);

  const getBuildingEventQueue = useCallback(
    (buildingFieldId: BuildingField['id']): BuildingEvent[] => {
      if (tribe !== 'romans') {
        return currentVillageBuildingEvents;
      }

      return buildingFieldId <= 18
        ? buildingEventQueues.resourceQueue
        : buildingEventQueues.villageQueue;
    },
    [tribe, currentVillageBuildingEvents, buildingEventQueues],
  );

  const value = useMemo(
    () => ({
      currentVillageBuildingEvents,
      getBuildingEventQueue,
    }),
    [currentVillageBuildingEvents, getBuildingEventQueue],
  );

  return (
    <CurrentVillageBuildingQueueContext value={value}>
      {children}
    </CurrentVillageBuildingQueueContext>
  );
};
