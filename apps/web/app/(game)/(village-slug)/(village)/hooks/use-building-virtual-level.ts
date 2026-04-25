import { use, useMemo } from 'react';
import type { Building } from '@pillage-first/types/models/building';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { CurrentVillageBuildingQueueContext } from 'app/(game)/(village-slug)/providers/current-village-building-queue-provider';

export const useBuildingVirtualLevel = (
  buildingId: Building['id'],
  buildingFieldId: BuildingField['id'],
) => {
  const { currentVillage } = useCurrentVillage();
  const { currentVillageBuildingEvents, scheduledBuildingUpgrades } = use(
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
    const sameBuildingConstructionEvents = currentVillageBuildingEvents.filter(
      ({
        buildingFieldId: eventBuildingFieldId,
        buildingId: buildingUnderConstructionId,
      }) => {
        return (
          buildingUnderConstructionId === buildingId &&
          eventBuildingFieldId === buildingFieldId
        );
      },
    );

    const sameBuildingScheduledUpgrades = scheduledBuildingUpgrades.filter(
      ({
        buildingFieldId: upgradeBuildingFieldId,
        buildingId: upgradeBuildingId,
      }) => {
        return (
          upgradeBuildingId === buildingId &&
          upgradeBuildingFieldId === buildingFieldId
        );
      },
    );

    const extraLevels =
      sameBuildingConstructionEvents.length +
      sameBuildingScheduledUpgrades.length;

    if (extraLevels > 0) {
      return actualLevel + extraLevels;
    }

    return actualLevel;
  }, [
    currentVillageBuildingEvents,
    scheduledBuildingUpgrades,
    buildingId,
    buildingFieldId,
    actualLevel,
  ]);

  return {
    doesBuildingExist,
    actualLevel,
    virtualLevel,
  };
};
