import { use, useCallback } from 'react';
import type { Building } from '@pillage-first/types/models/building';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import { useBuildingVirtualLevel } from 'app/(game)/(village-slug)/(village)/hooks/use-building-virtual-level';
import { playerVillagesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event';
import { CurrentVillageBuildingQueueContext } from 'app/(game)/(village-slug)/providers/current-village-building-queue-provider';

export const useBuildingActions = (
  buildingId: Building['id'],
  buildingFieldId: BuildingField['id'],
) => {
  const { getBuildingEventQueue } = use(CurrentVillageBuildingQueueContext);
  const { virtualLevel } = useBuildingVirtualLevel(buildingId, buildingFieldId);
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
      cachesToClearImmediately: [playerVillagesCacheKey],
    });
  }, [createBuildingConstructionEvent, buildingFieldId, buildingId]);

  const upgradeBuilding = useCallback(() => {
    const args = {
      buildingFieldId,
      buildingId,
      level: virtualLevel + 1,
      previousLevel: virtualLevel,
      cachesToClearImmediately: [playerVillagesCacheKey],
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
  ]);

  const downgradeBuilding = useCallback(() => {
    createBuildingLevelChangeEvent({
      buildingFieldId,
      level: virtualLevel - 1,
      previousLevel: virtualLevel,
      buildingId,
      cachesToClearImmediately: [],
    });
  }, [
    createBuildingLevelChangeEvent,
    buildingFieldId,
    buildingId,
    virtualLevel,
  ]);

  const demolishBuilding = useCallback(() => {
    createBuildingDestructionEvent({
      buildingFieldId,
      buildingId,
      previousLevel: virtualLevel,
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
