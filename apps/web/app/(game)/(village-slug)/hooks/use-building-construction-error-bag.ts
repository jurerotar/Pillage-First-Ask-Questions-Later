import { useMemo } from 'react';
import { getBuildingDataForLevel } from '@pillage-first/game-assets/utils/buildings';
import type { Building } from '@pillage-first/types/models/building';
import type { BorderIndicatorBorderVariant } from 'app/(game)/(village-slug)/components/border-indicator';
import { useHasAvailableBuildingQueueSlot } from 'app/(game)/(village-slug)/hooks/current-village/use-has-available-building-queue-slot';
import { useHasEnoughFreeCrop } from 'app/(game)/(village-slug)/hooks/current-village/use-has-enough-free-crop';
import { useHasEnoughResources } from 'app/(game)/(village-slug)/hooks/current-village/use-has-enough-resources';
import { useHasEnoughStorageCapacity } from 'app/(game)/(village-slug)/hooks/current-village/use-has-enough-storage-capacity';
import { useDeveloperSettings } from 'app/(game)/(village-slug)/hooks/use-developer-settings';

type UseBuildingRequirementsReturn = {
  errorBag: string[];
  variant: BorderIndicatorBorderVariant;
};

export const useBuildingConstructionErrorBag = (
  buildingId: Building['id'],
  level: number,
): UseBuildingRequirementsReturn => {
  const { developerSettings } = useDeveloperSettings();
  const { errorBag: hasEnoughFreeCropErrorBag } = useHasEnoughFreeCrop(
    buildingId,
    level,
  );
  const { nextLevelResourceCost } = getBuildingDataForLevel(buildingId, level);

  const { errorBag: hasEnoughResourcesErrorBag } = useHasEnoughResources(
    nextLevelResourceCost,
  );
  const { errorBag: hasEnoughWarehouseCapacityErrorBag } =
    useHasEnoughStorageCapacity('warehouseCapacity', nextLevelResourceCost);
  const { errorBag: hasEnoughGranaryCapacityErrorBag } =
    useHasEnoughStorageCapacity('granaryCapacity', nextLevelResourceCost);
  const { errorBag: hasHasAvailableBuildingQueueSlotErrorBag } =
    useHasAvailableBuildingQueueSlot();

  const {
    isFreeBuildingConstructionEnabled,
    isInstantBuildingConstructionEnabled,
  } = developerSettings;

  const errorBag = [
    ...(!isFreeBuildingConstructionEnabled
      ? [
          ...hasEnoughFreeCropErrorBag,
          ...hasEnoughResourcesErrorBag,
          ...hasEnoughWarehouseCapacityErrorBag,
          ...hasEnoughGranaryCapacityErrorBag,
        ]
      : []),
    ...(!isInstantBuildingConstructionEnabled
      ? [...hasHasAvailableBuildingQueueSlotErrorBag]
      : []),
  ];

  // Max-level variant is already handled in occupied-building-field.tsx
  const variant = useMemo<BorderIndicatorBorderVariant>(() => {
    if (
      !isFreeBuildingConstructionEnabled &&
      (hasEnoughFreeCropErrorBag.length > 0 ||
        hasEnoughWarehouseCapacityErrorBag.length > 0 ||
        hasEnoughGranaryCapacityErrorBag.length > 0)
    ) {
      return 'gray';
    }

    if (
      (!isInstantBuildingConstructionEnabled &&
        hasHasAvailableBuildingQueueSlotErrorBag.length > 0) ||
      (!isFreeBuildingConstructionEnabled &&
        hasEnoughResourcesErrorBag.length > 0)
    ) {
      return 'yellow';
    }

    return 'green';
  }, [
    isFreeBuildingConstructionEnabled,
    hasEnoughFreeCropErrorBag,
    hasEnoughWarehouseCapacityErrorBag,
    hasEnoughGranaryCapacityErrorBag,
    isInstantBuildingConstructionEnabled,
    hasHasAvailableBuildingQueueSlotErrorBag,
    hasEnoughResourcesErrorBag,
  ]);

  return {
    errorBag,
    variant,
  };
};
