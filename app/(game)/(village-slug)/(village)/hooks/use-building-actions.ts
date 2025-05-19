import { useBuildingVirtualLevel } from 'app/(game)/(village-slug)/(village)/hooks/use-building-virtual-level';
import { useComputedEffect } from 'app/(game)/(village-slug)/hooks/use-computed-effect';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event';
import { useDeveloperMode } from 'app/(game)/(village-slug)/hooks/use-developer-mode';
import { calculateBuildingCostForLevel, getBuildingDataForLevel } from 'app/(game)/(village-slug)/utils/building';
import type { Building } from 'app/interfaces/models/game/building';
import type { BuildingField } from 'app/interfaces/models/game/village';
import { isScheduledBuildingEvent } from 'app/(game)/(village-slug)/hooks/guards/event-guards';
import { useCurrentVillageBuildingEventQueue } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village-building-event-queue';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';

export const useBuildingActions = (buildingId: Building['id'], buildingFieldId: BuildingField['id']) => {
  const { currentVillage } = useCurrentVillage();
  const { currentVillageBuildingEventsQueue } = useCurrentVillageBuildingEventQueue(buildingFieldId);
  const { virtualLevel } = useBuildingVirtualLevel(buildingId, buildingFieldId);
  const { createEvent: createBuildingScheduledConstructionEvent } = useCreateEvent('buildingScheduledConstruction');
  const { createEvent: createBuildingConstructionEvent } = useCreateEvent('buildingConstruction');
  const { createEvent: createBuildingLevelChangeEvent } = useCreateEvent('buildingLevelChange');
  const { createEvent: createBuildingDestructionEvent } = useCreateEvent('buildingDestruction');
  const { total: buildingDurationModifier } = useComputedEffect('buildingDuration');
  const { isDeveloperModeActive } = useDeveloperMode();

  const hasCurrentVillageBuildingEvents = currentVillageBuildingEventsQueue.length > 0;

  const { nextLevelBuildingDuration } = getBuildingDataForLevel(buildingId, virtualLevel, currentVillage.isCapital);

  const calculateTimings = () => {
    if (isDeveloperModeActive) {
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
    const resourceCost = isDeveloperModeActive ? [0, 0, 0, 0] : calculateBuildingCostForLevel(buildingId, 0);
    const { startsAt, duration } = calculateTimings();

    createBuildingConstructionEvent({
      buildingFieldId: buildingFieldId!,
      buildingId,
      startsAt: Date.now(),
      duration: 0,
      resourceCost: hasCurrentVillageBuildingEvents ? [0, 0, 0, 0] : resourceCost,
      level: 1,
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
      });

      return;
    }

    createBuildingLevelChangeEvent({
      buildingFieldId: buildingFieldId!,
      level: 1,
      startsAt,
      duration,
      buildingId,
      // Cost can be 0, since it's already accounted for in the construction event
      resourceCost: [0, 0, 0, 0],
    });
  };

  const upgradeBuilding = () => {
    const resourceCost = isDeveloperModeActive ? [0, 0, 0, 0] : calculateBuildingCostForLevel(buildingId, virtualLevel + 1);
    const { startsAt, duration } = calculateTimings();

    if (hasCurrentVillageBuildingEvents) {
      createBuildingScheduledConstructionEvent({
        startsAt,
        duration,
        buildingFieldId: buildingFieldId!,
        buildingId,
        resourceCost,
        level: virtualLevel + 1,
      });

      return;
    }

    createBuildingLevelChangeEvent({
      startsAt,
      duration,
      buildingFieldId: buildingFieldId!,
      level: virtualLevel + 1,
      buildingId,
      resourceCost,
    });
  };

  const downgradeBuilding = () => {
    createBuildingLevelChangeEvent({
      startsAt: Date.now(),
      duration: 0,
      buildingFieldId: buildingFieldId!,
      level: virtualLevel - 1,
      buildingId,
      resourceCost: [0, 0, 0, 0],
    });
  };

  const demolishBuilding = () => {
    createBuildingDestructionEvent({
      startsAt: Date.now(),
      duration: 0,
      buildingFieldId: buildingFieldId!,
      buildingId,
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
