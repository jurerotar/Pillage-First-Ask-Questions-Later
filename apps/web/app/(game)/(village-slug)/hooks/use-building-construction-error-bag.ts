import { use } from 'react';
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
import { CurrentVillageBuildingQueueContext } from 'app/(game)/(village-slug)/providers/current-village-building-queue-context';
import { CurrentVillageComputedEffectsContext } from 'app/(game)/(village-slug)/providers/current-village-computed-effects-context';
import { CurrentVillageLiveResourcesContext } from 'app/(game)/(village-slug)/providers/current-village-live-resources-context';

type UseBuildingRequirementsReturn = {
  canUpgrade: boolean;
  errorBag: string[];
  variant: BorderIndicatorBorderVariant;
};

type UseBuildingConstructionStatusReturn = {
  canUpgrade: boolean;
  variant: BorderIndicatorBorderVariant;
};

type GetBuildingConstructionStatusArgs = {
  hasAvailableBuildingQueueSlot: boolean;
  hasEnoughFreeCrop: boolean;
  hasEnoughGranaryCapacity: boolean;
  hasEnoughResources: boolean;
  hasEnoughWarehouseCapacity: boolean;
  isFreeBuildingConstructionEnabled: boolean;
  isInstantBuildingConstructionEnabled: boolean;
};

const getBuildingConstructionStatus = ({
  hasAvailableBuildingQueueSlot,
  hasEnoughFreeCrop,
  hasEnoughGranaryCapacity,
  hasEnoughResources,
  hasEnoughWarehouseCapacity,
  isFreeBuildingConstructionEnabled,
  isInstantBuildingConstructionEnabled,
}: GetBuildingConstructionStatusArgs): UseBuildingConstructionStatusReturn => {
  const isResourceBlocked =
    !isFreeBuildingConstructionEnabled &&
    (!hasEnoughFreeCrop ||
      !hasEnoughResources ||
      !hasEnoughWarehouseCapacity ||
      !hasEnoughGranaryCapacity);
  const isQueueBlocked =
    !isInstantBuildingConstructionEnabled && !hasAvailableBuildingQueueSlot;

  if (
    !isFreeBuildingConstructionEnabled &&
    (!hasEnoughFreeCrop ||
      !hasEnoughWarehouseCapacity ||
      !hasEnoughGranaryCapacity)
  ) {
    return {
      canUpgrade: !isResourceBlocked && !isQueueBlocked,
      variant: 'gray',
    };
  }

  if (
    (!isInstantBuildingConstructionEnabled && !hasAvailableBuildingQueueSlot) ||
    (!isFreeBuildingConstructionEnabled && !hasEnoughResources)
  ) {
    return {
      canUpgrade: !isResourceBlocked && !isQueueBlocked,
      variant: 'yellow',
    };
  }

  return {
    canUpgrade: !isResourceBlocked && !isQueueBlocked,
    variant: 'green',
  };
};

export const useBuildingConstructionStatus = (
  buildingId: Building['id'],
  level: number,
  buildingFieldId: BuildingField['id'],
): UseBuildingConstructionStatusReturn => {
  const { developerSettings } = useDeveloperSettings();
  const { wood, clay, iron, wheat } = use(CurrentVillageLiveResourcesContext);
  const {
    computedWheatProductionEffect,
    computedWarehouseCapacityEffect,
    computedGranaryCapacityEffect,
  } = use(CurrentVillageComputedEffectsContext);
  const {
    buildingUpgradeEvents,
    getBuildingEventQueue,
    downgradedBuildingByFieldId,
  } = use(CurrentVillageBuildingQueueContext);
  const isScheduling = getBuildingEventQueue(buildingFieldId).length > 0;

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
    buildingUpgradeEvents.length < 5 &&
    !downgradedBuildingByFieldId.has(buildingFieldId);

  return getBuildingConstructionStatus({
    hasAvailableBuildingQueueSlot,
    hasEnoughFreeCrop: isScheduling || hasEnoughFreeCrop,
    hasEnoughGranaryCapacity: isScheduling || hasEnoughGranaryCapacity,
    hasEnoughResources: isScheduling || hasEnoughResources,
    hasEnoughWarehouseCapacity: isScheduling || hasEnoughWarehouseCapacity,
    isFreeBuildingConstructionEnabled,
    isInstantBuildingConstructionEnabled,
  });
};

export const useBuildingConstructionErrorBag = (
  buildingId: Building['id'],
  level: number,
  buildingFieldId: BuildingField['id'],
): UseBuildingRequirementsReturn => {
  const { developerSettings } = useDeveloperSettings();
  const { getBuildingEventQueue } = use(CurrentVillageBuildingQueueContext);
  const isScheduling = getBuildingEventQueue(buildingFieldId).length > 0;
  const { errorBag: hasEnoughFreeCropErrorBag, hasEnoughFreeCrop } =
    useHasEnoughFreeCrop(buildingId, level);
  const { nextLevelResourceCost } = getBuildingDataForLevel(buildingId, level);

  const { errorBag: hasEnoughResourcesErrorBag, hasEnoughResources } =
    useHasEnoughResources(nextLevelResourceCost);
  const {
    errorBag: hasEnoughWarehouseCapacityErrorBag,
    hasEnoughStorageCapacity: hasEnoughWarehouseCapacity,
  } = useHasEnoughStorageCapacity('warehouseCapacity', nextLevelResourceCost);
  const {
    errorBag: hasEnoughGranaryCapacityErrorBag,
    hasEnoughStorageCapacity: hasEnoughGranaryCapacity,
  } = useHasEnoughStorageCapacity('granaryCapacity', nextLevelResourceCost);
  const {
    errorBag: hasHasAvailableBuildingQueueSlotErrorBag,
    hasAvailableBuildingQueueSlot,
  } = useHasAvailableBuildingQueueSlot(buildingFieldId);

  const {
    isFreeBuildingConstructionEnabled,
    isInstantBuildingConstructionEnabled,
  } = developerSettings;

  const errorBag = [
    ...(!isFreeBuildingConstructionEnabled && !isScheduling
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

  const status = getBuildingConstructionStatus({
    hasAvailableBuildingQueueSlot,
    hasEnoughFreeCrop: isScheduling || hasEnoughFreeCrop,
    hasEnoughGranaryCapacity: isScheduling || hasEnoughGranaryCapacity,
    hasEnoughResources: isScheduling || hasEnoughResources,
    hasEnoughWarehouseCapacity: isScheduling || hasEnoughWarehouseCapacity,
    isFreeBuildingConstructionEnabled,
    isInstantBuildingConstructionEnabled,
  });

  return {
    canUpgrade: status.canUpgrade,
    errorBag,
    variant: status.variant,
  };
};
