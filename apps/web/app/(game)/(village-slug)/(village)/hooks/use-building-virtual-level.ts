import { use, useMemo } from 'react';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { CurrentVillageBuildingQueueContext } from 'app/(game)/(village-slug)/providers/current-village-building-queue-provider';

export const useBuildingVirtualLevel = (
  buildingFieldId: BuildingField['id'],
) => {
  const { currentVillage } = useCurrentVillage();
  const { buildingUpgradeEvents, buildingDowngradeEvents } = use(
    CurrentVillageBuildingQueueContext,
  );

  const building = useMemo(() => {
    return currentVillage.buildingFields.find(
      ({ id }) => id === buildingFieldId,
    );
  }, [currentVillage.buildingFields, buildingFieldId]);
  const doesBuildingExist = !!building;

  const actualLevel = building?.level ?? 0;

  const virtualLevel = useMemo(() => {
    const isDowngradingBuilding = buildingDowngradeEvents.some(
      ({ buildingFieldId: eventBuildingFieldId }) =>
        eventBuildingFieldId === buildingFieldId,
    );

    if (isDowngradingBuilding) {
      return actualLevel - 1;
    }

    const sameBuildingConstructionEvents = buildingUpgradeEvents.filter(
      ({ buildingFieldId: eventBuildingFieldId }) => {
        return eventBuildingFieldId === buildingFieldId;
      },
    );

    return actualLevel + sameBuildingConstructionEvents.length;
  }, [
    buildingUpgradeEvents,
    buildingDowngradeEvents,
    buildingFieldId,
    actualLevel,
  ]);

  const isUpgrading = virtualLevel > actualLevel;
  const isDowngrading = virtualLevel < actualLevel;

  return {
    doesBuildingExist,
    actualLevel,
    virtualLevel,
    isUpgrading,
    isDowngrading,
  };
};
