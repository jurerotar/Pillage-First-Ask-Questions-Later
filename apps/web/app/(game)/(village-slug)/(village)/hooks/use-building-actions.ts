import { use, useCallback } from 'react';
import type { Building } from '@pillage-first/types/models/building';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import { useBuildingVirtualLevel } from 'app/(game)/(village-slug)/(village)/hooks/use-building-virtual-level';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village.ts';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event';
import { CurrentVillageBuildingQueueContext } from 'app/(game)/(village-slug)/providers/current-village-building-queue-provider';
import {
  currentVillageCacheKey,
  eventsCacheKey,
} from 'app/(game)/constants/query-keys';

export const useBuildingActions = (
  buildingId: Building['id'],
  buildingFieldId: BuildingField['id'],
) => {
  const { currentVillage } = useCurrentVillage();
  const { getBuildingEventQueue } = use(CurrentVillageBuildingQueueContext);
  const { virtualLevel } = useBuildingVirtualLevel(buildingFieldId);
  const { createEvent: createBuildingScheduledConstructionEvent } =
    useCreateEvent('buildingScheduledConstruction');
  const { createEvent: createBuildingConstructionEvent } = useCreateEvent(
    'buildingConstruction',
  );
  const { createEvent: createBuildingLevelChangeEvent } = useCreateEvent(
    'buildingLevelChange',
  );
  const { createEvent: createBuildingDestructionEvent } = useCreateEvent(
    'buildingDestruction',
  );

  const currentVillageBuildingEventsQueue =
    getBuildingEventQueue(buildingFieldId);

  const hasCurrentVillageBuildingEvents =
    currentVillageBuildingEventsQueue.length > 0;

  const constructBuilding = useCallback(() => {
    createBuildingConstructionEvent({
      buildingFieldId,
      buildingId,
      level: 1,
      previousLevel: 0,
      cachesToClearImmediately: [[currentVillageCacheKey, currentVillage.slug]],
    });
  }, [
    createBuildingConstructionEvent,
    buildingFieldId,
    buildingId,
    currentVillage,
  ]);

  const upgradeBuilding = useCallback(() => {
    const args = {
      buildingFieldId,
      buildingId,
      level: virtualLevel + 1,
      previousLevel: virtualLevel,
      cachesToClearImmediately: [[currentVillageCacheKey, currentVillage.slug]],
    };

    if (hasCurrentVillageBuildingEvents) {
      createBuildingScheduledConstructionEvent(args);
      return;
    }

    createBuildingLevelChangeEvent(args);
  }, [
    buildingFieldId,
    buildingId,
    virtualLevel,
    hasCurrentVillageBuildingEvents,
    createBuildingScheduledConstructionEvent,
    createBuildingLevelChangeEvent,
    currentVillage,
  ]);

  const downgradeBuilding = useCallback(
    (targetLevel: number) => {
      createBuildingLevelChangeEvent({
        buildingFieldId,
        level: targetLevel,
        previousLevel: virtualLevel,
        buildingId,
        cachesToClearImmediately: [],
      });
    },
    [createBuildingLevelChangeEvent, buildingFieldId, buildingId, virtualLevel],
  );

  const demolishBuilding = useCallback(() => {
    createBuildingDestructionEvent({
      buildingFieldId,
      buildingId,
      previousLevel: virtualLevel,
      level: 0,
      cachesToClearImmediately: [
        [eventsCacheKey, 'buildingDestruction', currentVillage.id],
        [eventsCacheKey, 'buildingLevelChange', currentVillage.id],
      ],
    });
  }, [
    createBuildingDestructionEvent,
    buildingFieldId,
    buildingId,
    virtualLevel,
    currentVillage,
  ]);

  return {
    constructBuilding,
    upgradeBuilding,
    downgradeBuilding,
    demolishBuilding,
  };
};
