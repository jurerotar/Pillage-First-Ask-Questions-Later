import { useBuildingVirtualLevel } from 'app/[game]/[village]/hooks/use-building-virtual-level';
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
  const createBuildingConstructionEvent = useCreateEvent(GameEventType.BUILDING_CONSTRUCTION);
  const createBuildingLevelChangeEvent = useCreateEvent(GameEventType.BUILDING_LEVEL_CHANGE);
  const createBuildingDestructionEvent = useCreateEvent(GameEventType.BUILDING_DESTRUCTION);
  const { total: buildingDurationModifier } = useComputedEffect('buildingDuration');
  const { isDeveloperModeActive } = useDeveloperMode();

  const isTryingToBuildAResourceField = buildingFieldId! <= 18;

  const { building, nextLevelBuildingDuration } = getBuildingDataForLevel(buildingId, buildingLevel);

  const lastBuildingEventCompletionTimestamp =
    currentVillageBuildingEvents.length > 0 ? currentVillageBuildingEvents.at(-1)!.resolvesAt : Date.now();

  // Idea is that romans effectively have 2 queues, one for resources and one for village buildings
  const calculateResolvesAt = () => {
    if (isDeveloperModeActive) {
      return Date.now();
    }

    if (tribe === 'romans') {
      // We attach village events after village effects and resource events after resource events
      const resourceOrVillageBuildingEvents = currentVillageBuildingEvents.filter(({ buildingFieldId }) => {
        return isTryingToBuildAResourceField ? buildingFieldId <= 18 : buildingFieldId >= 19;
      });

      if (resourceOrVillageBuildingEvents.length > 0) {
        const { resolvesAt } = resourceOrVillageBuildingEvents.at(-1)!;
        return resolvesAt + nextLevelBuildingDuration * buildingDurationModifier;
      }

      return Date.now() + nextLevelBuildingDuration * buildingDurationModifier;
    }

    return lastBuildingEventCompletionTimestamp + nextLevelBuildingDuration * buildingDurationModifier;
  };

  const constructBuilding = () => {
    const resourceCost = isDeveloperModeActive ? [0, 0, 0, 0] : building.buildingCost[0];

    createBuildingConstructionEvent({
      buildingFieldId: buildingFieldId!,
      building,
      resolvesAt: Date.now(),
      resourceCost,
      level: 0,
    });

    createBuildingLevelChangeEvent({
      buildingFieldId: buildingFieldId!,
      level: 1,
      resolvesAt: calculateResolvesAt(),
      building,
      // Cost can be 0, since it's already accounted for in the construction event
      resourceCost: [0, 0, 0, 0],
    });
  };

  const upgradeBuilding = () => {
    const resourceCost = isDeveloperModeActive ? [0, 0, 0, 0] : building.buildingCost[0];

    createBuildingLevelChangeEvent({
      resolvesAt: calculateResolvesAt(),
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
    calculateResolvesAt,
  };
};
