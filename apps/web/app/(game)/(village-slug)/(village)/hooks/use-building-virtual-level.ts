import { use, useMemo } from 'react';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { CurrentVillageBuildingQueueContext } from 'app/(game)/(village-slug)/providers/current-village-building-queue-provider';

export const useBuildingVirtualLevel = (
  buildingFieldId: BuildingField['id'],
) => {
  const { currentVillage } = useCurrentVillage();
  const { buildingUpgradeEventCountByFieldId, downgradedBuildingByFieldId } =
    use(CurrentVillageBuildingQueueContext);

  const building = useMemo(() => {
    return currentVillage.buildingFields.find(
      ({ id }) => id === buildingFieldId,
    );
  }, [currentVillage.buildingFields, buildingFieldId]);
  const doesBuildingExist = !!building;

  const actualLevel = building?.level ?? 0;

  const virtualLevel = useMemo(() => {
    const isDowngradingBuilding =
      downgradedBuildingByFieldId.has(buildingFieldId);

    if (isDowngradingBuilding) {
      return actualLevel - 1;
    }

    return (
      actualLevel +
      (buildingUpgradeEventCountByFieldId.get(buildingFieldId) ?? 0)
    );
  }, [
    buildingUpgradeEventCountByFieldId,
    downgradedBuildingByFieldId,
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
