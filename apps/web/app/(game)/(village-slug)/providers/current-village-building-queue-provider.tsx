import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useMemo,
} from 'react';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import type { BuildingEvent } from '@pillage-first/types/models/game-event';
import { partition } from '@pillage-first/utils/array';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type.ts';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';

type CurrentVillageBuildingQueueContextReturn = {
  buildingEvents: BuildingEvent[];
  buildingUpgradeEvents: BuildingEvent[];
  buildingDowngradeEvents: BuildingEvent[];
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

  const { eventsByType: currentVillageBuildingLevelChangeEvents } =
    useEventsByType('buildingLevelChange');
  const { eventsByType: currentVillageBuildingScheduledConstructionEvents } =
    useEventsByType('buildingScheduledConstruction');

  const buildingEvents = useMemo(() => {
    return [
      ...currentVillageBuildingLevelChangeEvents,
      ...currentVillageBuildingScheduledConstructionEvents,
    ].toSorted((a, b) => a.startsAt + a.duration - (b.startsAt + b.duration));
  }, [
    currentVillageBuildingLevelChangeEvents,
    currentVillageBuildingScheduledConstructionEvents,
  ]);

  const [buildingUpgradeEvents, buildingDowngradeEvents] = useMemo(() => {
    return partition<BuildingEvent>(
      buildingEvents,
      ({ previousLevel, level }) => level > previousLevel,
    );
  }, [buildingEvents]);

  const buildingEventQueues = useMemo(() => {
    const [resourceQueue, villageQueue] = partition<BuildingEvent>(
      buildingUpgradeEvents,
      (event) => event.buildingFieldId <= 18,
    );

    return {
      resourceQueue,
      villageQueue,
    };
  }, [buildingUpgradeEvents]);

  const getBuildingEventQueue = useCallback(
    (buildingFieldId: BuildingField['id']): BuildingEvent[] => {
      if (tribe !== 'romans') {
        return buildingUpgradeEvents;
      }

      return buildingFieldId <= 18
        ? buildingEventQueues.resourceQueue
        : buildingEventQueues.villageQueue;
    },
    [tribe, buildingUpgradeEvents, buildingEventQueues],
  );

  const value = useMemo(
    () => ({
      buildingEvents,
      buildingUpgradeEvents,
      getBuildingEventQueue,
      buildingDowngradeEvents,
    }),
    [
      buildingEvents,
      buildingDowngradeEvents,
      getBuildingEventQueue,
      buildingUpgradeEvents,
    ],
  );

  return (
    <CurrentVillageBuildingQueueContext value={value}>
      {children}
    </CurrentVillageBuildingQueueContext>
  );
};
