import { useBuildingVirtualLevel } from 'app/(game)/(village-slug)/(village)/hooks/use-building-virtual-level';
import { useComputedEffect } from 'app/(game)/(village-slug)/hooks/use-computed-effect';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event';
import { useDeveloperMode } from 'app/(game)/(village-slug)/hooks/use-developer-mode';
import { calculateBuildingCostForLevel, getBuildingDataForLevel } from 'app/(game)/(village-slug)/utils/building';
import type { Building } from 'app/interfaces/models/game/building';
import type { BuildingField } from 'app/interfaces/models/game/village';
import { isScheduledBuildingEvent } from 'app/(game)/guards/event-guards';
import { useCurrentVillageBuildingEventQueue } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village-building-event-queue';
import {
  collectableQuestCountCacheKey,
  effectsCacheKey,
  playerVillagesCacheKey,
  questsCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';

export const useBuildingActions = (buildingId: Building['id'], buildingFieldId: BuildingField['id']) => {
  const { currentVillageBuildingEventsQueue } = useCurrentVillageBuildingEventQueue(buildingFieldId);
  const { virtualLevel } = useBuildingVirtualLevel(buildingId, buildingFieldId);
  const { createEvent: createBuildingScheduledConstructionEvent } = useCreateEvent('buildingScheduledConstruction');
  const { createEvent: createBuildingConstructionEvent } = useCreateEvent('buildingConstruction');
  const { createEvent: createBuildingLevelChangeEvent } = useCreateEvent('buildingLevelChange');
  const { createEvent: createBuildingDestructionEvent } = useCreateEvent('buildingDestruction');
  const { total: buildingDurationModifier } = useComputedEffect('buildingDuration');
  const { isDeveloperModeEnabled } = useDeveloperMode();

  const hasCurrentVillageBuildingEvents = currentVillageBuildingEventsQueue.length > 0;

  const { nextLevelBuildingDuration } = getBuildingDataForLevel(buildingId, virtualLevel);

  const calculateTimings = () => {
    if (isDeveloperModeEnabled) {
      return {
        startsAt: Date.now(),
        duration: 0,
      };
    }

    const lastBuildingEventCompletionTimestamp = (() => {
      if (!hasCurrentVillageBuildingEvents) {
        return Date.now();
      }

      const lastBuildingEvent = currentVillageBuildingEventsQueue.at(-1)!;
      const { startsAt, duration } = lastBuildingEvent;

      if (isScheduledBuildingEvent(lastBuildingEvent)) {
        return startsAt + duration;
      }

      return startsAt + duration - (Date.now() - startsAt);
    })();

    // Idea is that createBuildingScheduledConstructionEvent should resolve whenever a previous building was completed and then start a new one
    return {
      startsAt: lastBuildingEventCompletionTimestamp,
      duration: nextLevelBuildingDuration * buildingDurationModifier,
    };
  };

  const constructBuilding = () => {
    const resourceCost = isDeveloperModeEnabled ? [0, 0, 0, 0] : calculateBuildingCostForLevel(buildingId, 0);
    const { startsAt, duration } = calculateTimings();

    createBuildingConstructionEvent({
      buildingFieldId: buildingFieldId!,
      buildingId,
      startsAt: Date.now(),
      duration: 0,
      level: 1,
      cachesToClearOnResolve: [playerVillagesCacheKey],
      cachesToClearImmediately: [playerVillagesCacheKey],
    });

    // In case we're already building something, just create a scheduled construction event
    if (hasCurrentVillageBuildingEvents) {
      createBuildingScheduledConstructionEvent({
        buildingFieldId: buildingFieldId!,
        startsAt,
        duration,
        buildingId,
        resourceCost,
        level: 1,
        cachesToClearOnResolve: [playerVillagesCacheKey, effectsCacheKey],
        cachesToClearImmediately: [],
      });

      return;
    }

    // else; start upgrade event now
    createBuildingLevelChangeEvent({
      buildingFieldId: buildingFieldId!,
      level: 1,
      startsAt,
      duration,
      buildingId,
      // Cost can be 0, since it's already accounted for in the construction event
      resourceCost,
      cachesToClearOnResolve: [playerVillagesCacheKey, effectsCacheKey, questsCacheKey, collectableQuestCountCacheKey],
      cachesToClearImmediately: [playerVillagesCacheKey],
    });
  };

  const upgradeBuilding = () => {
    const resourceCost = isDeveloperModeEnabled ? [0, 0, 0, 0] : calculateBuildingCostForLevel(buildingId, virtualLevel + 1);
    const { startsAt, duration } = calculateTimings();

    const args = {
      startsAt,
      duration,
      buildingFieldId: buildingFieldId!,
      buildingId,
      resourceCost,
      level: virtualLevel + 1,
      cachesToClearOnResolve: [playerVillagesCacheKey, effectsCacheKey, questsCacheKey, collectableQuestCountCacheKey],
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
      startsAt: Date.now(),
      duration: 0,
      buildingFieldId: buildingFieldId!,
      level: virtualLevel - 1,
      buildingId,
      resourceCost: [0, 0, 0, 0],
      cachesToClearOnResolve: [playerVillagesCacheKey, effectsCacheKey],
      cachesToClearImmediately: [],
    });
  };

  const demolishBuilding = () => {
    createBuildingDestructionEvent({
      startsAt: Date.now(),
      duration: 0,
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
    calculateTimings,
  };
};
