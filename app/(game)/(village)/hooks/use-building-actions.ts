import { useBuildingVirtualLevel } from 'app/(game)/(village)/hooks/use-building-virtual-level';
import { isScheduledBuildingEvent } from 'app/(game)/hooks/guards/event-guards';
import { useComputedEffect } from 'app/(game)/hooks/use-computed-effect';
import { useCreateEvent } from 'app/(game)/hooks/use-create-event';
import { useDeveloperMode } from 'app/(game)/hooks/use-developer-mode';
import { useEvents } from 'app/(game)/hooks/use-events';
import { useTribe } from 'app/(game)/hooks/use-tribe';
import { getBuildingDataForLevel } from 'app/(game)/utils/building';
import { GameEventType } from 'app/interfaces/models/game/game-event';
import type { Building } from 'app/interfaces/models/game/building';
import type { BuildingField } from 'app/interfaces/models/game/village';

export const useBuildingActions = (buildingId: Building['id'], buildingFieldId: BuildingField['id']) => {
  const { tribe } = useTribe();
  const { currentVillageBuildingEvents } = useEvents();
  const { buildingLevel } = useBuildingVirtualLevel(buildingId, buildingFieldId);
  const { createEvent: createBuildingScheduledConstructionEvent } = useCreateEvent(GameEventType.BUILDING_SCHEDULED_CONSTRUCTION);
  const { createEvent: createBuildingConstructionEvent } = useCreateEvent(GameEventType.BUILDING_CONSTRUCTION);
  const { createEvent: createBuildingLevelChangeEvent } = useCreateEvent(GameEventType.BUILDING_LEVEL_CHANGE);
  const { createEvent: createBuildingDestructionEvent } = useCreateEvent(GameEventType.BUILDING_DESTRUCTION);
  const { total: buildingDurationModifier } = useComputedEffect('buildingDuration');
  const { isDeveloperModeActive } = useDeveloperMode();

  // Idea is that romans effectively have 2 queues, one for resources and one for village buildings, while other tribes only have 1.
  // To make things simpler bellow, we essentially split the building queue at this point.
  const buildingEvents =
    tribe === 'romans'
      ? currentVillageBuildingEvents.filter((event) => {
          if (buildingFieldId! <= 18) {
            return event.buildingFieldId <= 18;
          }

          return event.buildingFieldId > 18;
        })
      : currentVillageBuildingEvents;

  const hasCurrentVillageBuildingEvents = buildingEvents.length > 0;

  const { building, nextLevelBuildingDuration } = getBuildingDataForLevel(buildingId, buildingLevel);

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

      const lastBuildingEvent = buildingEvents.at(-1)!;
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
    const resourceCost = isDeveloperModeActive ? [0, 0, 0, 0] : building.buildingCost[0];
    const { startsAt, duration } = calculateTimings();

    createBuildingConstructionEvent({
      buildingFieldId: buildingFieldId!,
      building,
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
        building,
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
      building,
      // Cost can be 0, since it's already accounted for in the construction event
      resourceCost: [0, 0, 0, 0],
    });
  };

  const upgradeBuilding = () => {
    const resourceCost = isDeveloperModeActive ? [0, 0, 0, 0] : building.buildingCost[0];
    const { startsAt, duration } = calculateTimings();

    if (hasCurrentVillageBuildingEvents) {
      createBuildingScheduledConstructionEvent({
        startsAt,
        duration,
        buildingFieldId: buildingFieldId!,
        building,
        resourceCost,
        level: buildingLevel + 1,
      });

      return;
    }

    createBuildingLevelChangeEvent({
      startsAt,
      duration,
      buildingFieldId: buildingFieldId!,
      level: buildingLevel + 1,
      building,
      resourceCost,
    });
  };

  const downgradeBuilding = () => {
    createBuildingLevelChangeEvent({
      startsAt: Date.now(),
      duration: 0,
      buildingFieldId: buildingFieldId!,
      level: buildingLevel - 1,
      building,
      resourceCost: [0, 0, 0, 0],
    });
  };

  const demolishBuilding = () => {
    createBuildingDestructionEvent({
      startsAt: Date.now(),
      duration: 0,
      buildingFieldId: buildingFieldId!,
      building,
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
