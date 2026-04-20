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
import {
  type ScheduledBuildingUpgrade,
  useScheduledBuildingUpgrades,
} from 'app/(game)/(village-slug)/hooks/use-scheduled-building-upgrades';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';

type CurrentVillageBuildingQueueContextReturn = {
  currentVillageBuildingEvents: BuildingEvent[];
  scheduledBuildingUpgrades: ScheduledBuildingUpgrade[];
  getBuildingEventQueue: (
    buildingFieldId: BuildingField['id'],
  ) => (BuildingEvent | ScheduledBuildingUpgrade)[];
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
  const { scheduledBuildingUpgrades } = useScheduledBuildingUpgrades();

  const buildingEvents = useMemo(() => {
    return [...currentVillageBuildingEvents, ...scheduledBuildingUpgrades];
  }, [currentVillageBuildingEvents, scheduledBuildingUpgrades]);

  const buildingEventQueues = useMemo(() => {
    const [resourceQueue, villageQueue] = partition(
      buildingEvents,
      (event) => event.buildingFieldId <= 18,
    );

    return {
      resourceQueue,
      villageQueue,
    };
  }, [buildingEvents]);

  const getBuildingEventQueue = useCallback(
    (
      buildingFieldId: BuildingField['id'],
    ): (BuildingEvent | ScheduledBuildingUpgrade)[] => {
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
      scheduledBuildingUpgrades,
      getBuildingEventQueue,
    }),
    [
      currentVillageBuildingEvents,
      scheduledBuildingUpgrades,
      getBuildingEventQueue,
    ],
  );

  return (
    <CurrentVillageBuildingQueueContext value={value}>
      {children}
    </CurrentVillageBuildingQueueContext>
  );
};
