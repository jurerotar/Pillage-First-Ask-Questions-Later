import { use, useMemo } from 'react';
import { getBuildingDataForLevel } from '@pillage-first/game-assets/utils/buildings';
import type { Building } from '@pillage-first/types/models/building';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import type { BorderIndicatorBorderVariant } from 'app/(game)/(village-slug)/components/border-indicator';
import { useHasAvailableBuildingQueueSlot } from 'app/(game)/(village-slug)/hooks/current-village/use-has-available-building-queue-slot';
import {
  getHasEnoughFreeCrop,
  useHasEnoughFreeCrop,
} from 'app/(game)/(village-slug)/hooks/current-village/use-has-enough-free-crop';
import {
  getHasEnoughResources,
  useHasEnoughResources,
} from 'app/(game)/(village-slug)/hooks/current-village/use-has-enough-resources';
import {
  getHasEnoughGranaryCapacity,
  getHasEnoughWarehouseCapacity,
  useHasEnoughStorageCapacity,
} from 'app/(game)/(village-slug)/hooks/current-village/use-has-enough-storage-capacity';
import { useDeveloperSettings } from 'app/(game)/(village-slug)/hooks/use-developer-settings';
import { CurrentVillageBuildingQueueContext } from 'app/(game)/(village-slug)/providers/current-village-building-queue-provider';
import { CurrentVillageStateContext } from 'app/(game)/(village-slug)/providers/current-village-state-provider';

type UseBuildingRequirementsReturn = {
  canUpgrade: boolean;
  errorBag: string[];
  variant: BorderIndicatorBorderVariant;
};

type UseBuildingConstructionStatusReturn = {
  canUpgrade: boolean;
  variant: BorderIndicatorBorderVariant;
};

export const useBuildingConstructionStatus = (
  buildingId: Building['id'],
  level: number,
  buildingFieldId: BuildingField['id'],
): UseBuildingConstructionStatusReturn => {
  const { developerSettings } = useDeveloperSettings();
  const {
    wood,
    clay,
    iron,
    wheat,
    computedWheatProductionEffect,
    computedWarehouseCapacityEffect,
    computedGranaryCapacityEffect,
  } = use(CurrentVillageStateContext);
  const { getBuildingEventQueue, downgradedBuildingByFieldId } = use(
    CurrentVillageBuildingQueueContext,
  );

  const { nextLevelPopulation, population, nextLevelResourceCost } =
    getBuildingDataForLevel(buildingId, level);

  const {
    isFreeBuildingConstructionEnabled,
    isInstantBuildingConstructionEnabled,
  } = developerSettings;

  const hasEnoughFreeCrop = getHasEnoughFreeCrop(
    nextLevelPopulation - population,
    computedWheatProductionEffect.buildingWheatLimit,
  );
  const hasEnoughResources = getHasEnoughResources(nextLevelResourceCost, {
    wood,
    clay,
    iron,
    wheat,
  });
  const hasEnoughWarehouseCapacity = getHasEnoughWarehouseCapacity(
    computedWarehouseCapacityEffect.total,
    nextLevelResourceCost,
  );
  const hasEnoughGranaryCapacity = getHasEnoughGranaryCapacity(
    computedGranaryCapacityEffect.total,
    nextLevelResourceCost[3],
  );
  const hasAvailableBuildingQueueSlot =
    getBuildingEventQueue(buildingFieldId).length < 1 &&
    !downgradedBuildingByFieldId.has(buildingFieldId);

  const isResourceBlocked =
    !isFreeBuildingConstructionEnabled &&
    (!hasEnoughFreeCrop ||
      !hasEnoughResources ||
      !hasEnoughWarehouseCapacity ||
      !hasEnoughGranaryCapacity);
  const isQueueBlocked =
    !isInstantBuildingConstructionEnabled && !hasAvailableBuildingQueueSlot;

  const variant = useMemo<BorderIndicatorBorderVariant>(() => {
    if (
      !isFreeBuildingConstructionEnabled &&
      (!hasEnoughFreeCrop ||
        !hasEnoughWarehouseCapacity ||
        !hasEnoughGranaryCapacity)
    ) {
      return 'gray';
    }

    if (
      (!isInstantBuildingConstructionEnabled &&
        !hasAvailableBuildingQueueSlot) ||
      (!isFreeBuildingConstructionEnabled && !hasEnoughResources)
    ) {
      return 'yellow';
    }

    return 'green';
  }, [
    isFreeBuildingConstructionEnabled,
    hasEnoughFreeCrop,
    hasEnoughWarehouseCapacity,
    hasEnoughGranaryCapacity,
    isInstantBuildingConstructionEnabled,
    hasAvailableBuildingQueueSlot,
    hasEnoughResources,
  ]);

  return {
    canUpgrade: !isResourceBlocked && !isQueueBlocked,
    variant,
  };
};

export const useBuildingConstructionErrorBag = (
  buildingId: Building['id'],
  level: number,
  buildingFieldId: BuildingField['id'],
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
    useHasAvailableBuildingQueueSlot(buildingFieldId);

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
    canUpgrade: errorBag.length === 0,
    errorBag,
    variant,
  };
};
