import { useBuildingVirtualLevel } from 'app/(game)/(village-slug)/(village)/hooks/use-building-virtual-level';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event';
import type { Building } from 'app/interfaces/models/game/building';
import type { BuildingField } from 'app/interfaces/models/game/village';
import {
  collectableQuestCountCacheKey,
  effectsCacheKey,
  playerVillagesCacheKey,
  questsCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import { use } from 'react';
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

  const constructBuilding = () => {
    createBuildingConstructionEvent({
      buildingFieldId: buildingFieldId!,
      buildingId,
      level: 1,
      cachesToClearOnResolve: [
        playerVillagesCacheKey,
        effectsCacheKey,
        questsCacheKey,
        collectableQuestCountCacheKey,
      ],
      cachesToClearImmediately: [playerVillagesCacheKey],
    });
  };

  const upgradeBuilding = () => {
    const args = {
      buildingFieldId: buildingFieldId!,
      buildingId,
      level: virtualLevel + 1,
      cachesToClearOnResolve: [
        playerVillagesCacheKey,
        effectsCacheKey,
        questsCacheKey,
        collectableQuestCountCacheKey,
      ],
      cachesToClearImmediately: [playerVillagesCacheKey],
    };

    if (hasCurrentVillageBuildingEvents) {
      createBuildingScheduledConstructionEvent(args);
      return;
    }

    createBuildingLevelChangeEvent(args);
  };

  const downgradeBuilding = () => {
    createBuildingLevelChangeEvent({
      buildingFieldId: buildingFieldId!,
      level: virtualLevel - 1,
      buildingId,
      cachesToClearOnResolve: [playerVillagesCacheKey, effectsCacheKey],
      cachesToClearImmediately: [],
    });
  };

  const demolishBuilding = () => {
    createBuildingDestructionEvent({
      buildingFieldId: buildingFieldId!,
      buildingId,
      cachesToClearOnResolve: [playerVillagesCacheKey, effectsCacheKey],
      cachesToClearImmediately: [],
    });
  };

  return {
    constructBuilding,
    upgradeBuilding,
    downgradeBuilding,
    demolishBuilding,
  };
};
