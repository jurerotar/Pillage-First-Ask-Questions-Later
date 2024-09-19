import { useBuildingVirtualLevel } from 'app/[game]/[village]/hooks/use-building-virtual-level';
import { isScheduledBuildingEvent } from 'app/[game]/hooks/guards/event-guards';
import { useComputedEffect } from 'app/[game]/hooks/use-computed-effect';
import { useDeveloperMode } from 'app/[game]/hooks/use-developer-mode';
import { useCreateEvent, useEvents } from 'app/[game]/hooks/use-events';
import { useTribe } from 'app/[game]/hooks/use-tribe';
import { getBuildingDataForLevel } from 'app/[game]/utils/building';
import { GameEventType } from 'interfaces/models/events/game-event';
import type { Building } from 'interfaces/models/game/building';
import type { BuildingField } from 'interfaces/models/game/village';

export const useBuildingActions = (buildingId: Building['id'], buildingFieldId: BuildingField['id']) => {
  const { tribe } = useTribe();
  const { currentVillageBuildingEvents } = useEvents();
  const { buildingLevel } = useBuildingVirtualLevel(buildingId, buildingFieldId);
  const createBuildingScheduledConstructionEvent = useCreateEvent(GameEventType.BUILDING_SCHEDULED_CONSTRUCTION);
  const createBuildingConstructionEvent = useCreateEvent(GameEventType.BUILDING_CONSTRUCTION);
  const createBuildingLevelChangeEvent = useCreateEvent(GameEventType.BUILDING_LEVEL_CHANGE);
  const createBuildingDestructionEvent = useCreateEvent(GameEventType.BUILDING_DESTRUCTION);
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
        startAt: Date.now(),
        duration: 0,
      };
    }

    const lastBuildingEventCompletionTimestamp = (() => {
      if (!hasCurrentVillageBuildingEvents) {
        return Date.now();
      }

      const lastBuildingEvent = buildingEvents.at(-1)!;

      if (isScheduledBuildingEvent(lastBuildingEvent)) {
        return lastBuildingEvent.startAt + lastBuildingEvent.duration;
      }

      return lastBuildingEvent.resolvesAt;
    })();

    // Idea is that createBuildingScheduledConstructionEvent should resolve whenever a previous building was completed and then start a new one
    return {
      startAt: lastBuildingEventCompletionTimestamp,
      duration: nextLevelBuildingDuration * buildingDurationModifier,
    };
  };

  const constructBuilding = () => {
    const resourceCost = isDeveloperModeActive ? [0, 0, 0, 0] : building.buildingCost[0];
    const { startAt, duration } = calculateTimings();

    createBuildingConstructionEvent({
      buildingFieldId: buildingFieldId!,
      building,
      resolvesAt: Date.now(),
      resourceCost,
      level: 1,
    });

    // In case we're already building something, just create a scheduled construction event
    if (hasCurrentVillageBuildingEvents) {
      createBuildingScheduledConstructionEvent({
        buildingFieldId: buildingFieldId!,
        resolvesAt: startAt,
        startAt,
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
      resolvesAt: startAt + duration,
      building,
      // Cost can be 0, since it's already accounted for in the construction event
      resourceCost: [0, 0, 0, 0],
    });
  };

  const upgradeBuilding = () => {
    const resourceCost = isDeveloperModeActive ? [0, 0, 0, 0] : building.buildingCost[0];
    const { startAt, duration } = calculateTimings();

    if (hasCurrentVillageBuildingEvents) {
      createBuildingScheduledConstructionEvent({
        resolvesAt: startAt,
        startAt,
        duration,
        buildingFieldId: buildingFieldId!,
        building,
        resourceCost,
        level: buildingLevel + 1,
      });

      return;
    }

    createBuildingLevelChangeEvent({
      resolvesAt: startAt + duration,
      buildingFieldId: buildingFieldId!,
      level: buildingLevel + 1,
      building,
      resourceCost,
    });
  };

  const downgradeBuilding = () => {
    createBuildingLevelChangeEvent({
      resolvesAt: Date.now(),
      buildingFieldId: buildingFieldId!,
      level: buildingLevel - 1,
      building,
      resourceCost: [0, 0, 0, 0],
    });
  };

  const demolishBuilding = () => {
    createBuildingDestructionEvent({
      resolvesAt: Date.now(),
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
