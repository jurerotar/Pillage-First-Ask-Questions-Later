import { use, useCallback } from 'react';
import type { Building } from '@pillage-first/types/models/building';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import { useBuildingVirtualLevel } from 'app/(game)/(village-slug)/(village)/hooks/use-building-virtual-level';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event';
import { useScheduledBuildingUpgrades } from 'app/(game)/(village-slug)/hooks/use-scheduled-building-upgrades';
import { CurrentVillageBuildingQueueContext } from 'app/(game)/(village-slug)/providers/current-village-building-queue-provider';
import { currentVillageCacheKey } from 'app/(game)/constants/query-keys';

export const useBuildingActions = (
  buildingId: Building['id'],
  buildingFieldId: BuildingField['id'],
) => {
  const { currentVillage } = useCurrentVillage();
  const { slug: currentVillageSlug } = currentVillage;
  const { getBuildingEventQueue } = use(CurrentVillageBuildingQueueContext);
  const { virtualLevel } = useBuildingVirtualLevel(buildingFieldId);
  const { scheduleBuildingUpgrade } = useScheduledBuildingUpgrades();
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
    if (hasCurrentVillageBuildingEvents) {
      scheduleBuildingUpgrade({
        buildingFieldId,
        buildingId,
        level: 1,
      });
      return;
    }

    createBuildingConstructionEvent({
      buildingFieldId,
      buildingId,
      level: 1,
      previousLevel: 0,
      cachesToClearImmediately: [[currentVillageCacheKey, currentVillageSlug]],
    });
  }, [
    createBuildingConstructionEvent,
    scheduleBuildingUpgrade,
    hasCurrentVillageBuildingEvents,
    buildingFieldId,
    buildingId,
    currentVillageSlug,
  ]);

  const upgradeBuilding = useCallback(() => {
    const args = {
      buildingFieldId,
      buildingId,
      level: virtualLevel + 1,
    };

    if (hasCurrentVillageBuildingEvents) {
      scheduleBuildingUpgrade(args);
      return;
    }

    createBuildingLevelChangeEvent({
      ...args,
      previousLevel: virtualLevel,
      cachesToClearImmediately: [[currentVillageCacheKey, currentVillageSlug]],
    });
  }, [
    buildingFieldId,
    buildingId,
    virtualLevel,
    hasCurrentVillageBuildingEvents,
    scheduleBuildingUpgrade,
    createBuildingLevelChangeEvent,
    currentVillageSlug,
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
      cachesToClearImmediately: [],
    });
  }, [
    createBuildingDestructionEvent,
    buildingFieldId,
    buildingId,
    virtualLevel,
  ]);

  return {
    constructBuilding,
    upgradeBuilding,
    downgradeBuilding,
    demolishBuilding,
  };
};
