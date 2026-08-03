import { type PropsWithChildren, useCallback, useMemo } from 'react';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import type { BuildingEvent } from '@pillage-first/types/models/game-event';
import { partition } from '@pillage-first/utils/array';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';
import { useScheduledBuildingUpgrades } from 'app/(game)/(village-slug)/hooks/use-scheduled-building-upgrades';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import {
  type BuildingUpgradeQueueEntry,
  CurrentVillageBuildingQueueContext,
} from 'app/(game)/(village-slug)/providers/current-village-building-queue-context';

export const CurrentVillageBuildingQueueContextProvider = ({
  children,
}: PropsWithChildren) => {
  const tribe = useTribe();

  const { eventsByType: currentVillageBuildingConstructionEvents } =
    useEventsByType('buildingConstruction');
  const { eventsByType: currentVillageBuildingDestructionEvents } =
    useEventsByType('buildingDestruction');
  const { eventsByType: currentVillageBuildingLevelChangeEvents } =
    useEventsByType('buildingLevelChange');
  const { eventsByType: currentVillageBuildingScheduledConstructionEvents } =
    useEventsByType('buildingScheduledConstruction');
  const { scheduledBuildingUpgrades } = useScheduledBuildingUpgrades();

  const buildingEvents = useMemo(() => {
    return [
      ...currentVillageBuildingConstructionEvents,
      ...currentVillageBuildingDestructionEvents,
      ...currentVillageBuildingLevelChangeEvents,
      ...currentVillageBuildingScheduledConstructionEvents,
    ].toSorted((a, b) => a.startsAt + a.duration - (b.startsAt + b.duration));
  }, [
    currentVillageBuildingConstructionEvents,
    currentVillageBuildingLevelChangeEvents,
    currentVillageBuildingScheduledConstructionEvents,
    currentVillageBuildingDestructionEvents,
  ]);

  const [activeBuildingUpgradeEvents, buildingDowngradeEvents] = useMemo(() => {
    return partition<BuildingEvent>(
      buildingEvents,
      ({ previousLevel, level }) => level > previousLevel,
    );
  }, [buildingEvents]);
  const buildingUpgradeEvents = useMemo(
    () => [...activeBuildingUpgradeEvents, ...scheduledBuildingUpgrades],
    [activeBuildingUpgradeEvents, scheduledBuildingUpgrades],
  );

  const buildingEventByFieldId = useMemo(() => {
    return new Map(
      buildingEvents.map((event) => [event.buildingFieldId, event]),
    );
  }, [buildingEvents]);

  const buildingUpgradeEventCountByFieldId = useMemo(() => {
    const eventCountByFieldId = new Map<BuildingField['id'], number>();

    for (const event of buildingUpgradeEvents) {
      const { buildingFieldId } = event;
      eventCountByFieldId.set(
        buildingFieldId,
        (eventCountByFieldId.get(buildingFieldId) ?? 0) + 1,
      );
    }

    return eventCountByFieldId;
  }, [buildingUpgradeEvents]);

  const downgradedBuildingByFieldId = useMemo(() => {
    return new Map(
      buildingDowngradeEvents.map((event) => [event.buildingFieldId, event]),
    );
  }, [buildingDowngradeEvents]);

  const buildingEventQueues = useMemo(() => {
    const [resourceQueue, villageQueue] = partition<BuildingUpgradeQueueEntry>(
      buildingUpgradeEvents,
      (event) => event.buildingFieldId <= 18,
    );

    return {
      resourceQueue,
      villageQueue,
    };
  }, [buildingUpgradeEvents]);

  const getBuildingEventQueue = useCallback(
    (buildingFieldId: BuildingField['id']): BuildingUpgradeQueueEntry[] => {
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
      buildingEventByFieldId,
      buildingUpgradeEventCountByFieldId,
      buildingUpgradeEvents,
      downgradedBuildingByFieldId,
      getBuildingEventQueue,
      buildingDowngradeEvents,
    }),
    [
      buildingEvents,
      buildingEventByFieldId,
      buildingDowngradeEvents,
      buildingUpgradeEventCountByFieldId,
      downgradedBuildingByFieldId,
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
