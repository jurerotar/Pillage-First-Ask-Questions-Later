import { useTranslation } from 'react-i18next';
import type { BorderIndicatorBorderVariant } from 'app/(game)/(village-slug)/components/border-indicator';
import { useHasAvailableBuildingQueueSlot } from 'app/(game)/(village-slug)/hooks/current-village/use-has-available-building-queue-slot';
import { useHasEnoughFreeCrop } from 'app/(game)/(village-slug)/hooks/current-village/use-has-enough-free-crop';
import { useHasEnoughResources } from 'app/(game)/(village-slug)/hooks/current-village/use-has-enough-resources';
import { useHasEnoughStorageCapacity } from 'app/(game)/(village-slug)/hooks/current-village/use-has-enough-storage-capacity';
import { useDeveloperMode } from 'app/(game)/(village-slug)/hooks/use-developer-mode';
import { getBuildingDataForLevel } from 'app/assets/utils/buildings';
import type { Building } from 'app/interfaces/models/game/building';
import type { BuildingField } from 'app/interfaces/models/game/village';

type UseBuildingRequirementsReturn = {
  variant: BorderIndicatorBorderVariant;
  errors: string[];
};

const useBuildingRequirements = (
  buildingId: Building['id'],
  level: number,
  buildingFieldId: BuildingField['id'],
): UseBuildingRequirementsReturn => {
  const { t } = useTranslation();
  const { isDeveloperModeEnabled } = useDeveloperMode();
  const { errorBag: hasEnoughFreeCropErrorBag } = useHasEnoughFreeCrop(
    buildingId,
    level,
  );

  const { nextLevelResourceCost, isMaxLevel } = getBuildingDataForLevel(
    buildingId,
    level,
  );

  const { errorBag: hasEnoughResourcesErrorBag } = useHasEnoughResources(
    nextLevelResourceCost,
  );
  const { errorBag: hasEnoughWarehouseCapacityErrorBag } =
    useHasEnoughStorageCapacity('warehouseCapacity', nextLevelResourceCost);
  const { errorBag: hasEnoughGranaryCapacityErrorBag } =
    useHasEnoughStorageCapacity('granaryCapacity', nextLevelResourceCost);
  const { errorBag: hasHasAvailableBuildingQueueSlotErrorBag } =
    useHasAvailableBuildingQueueSlot(buildingFieldId);

  const errorBag = [
    ...hasEnoughFreeCropErrorBag,
    ...hasEnoughResourcesErrorBag,
    ...hasEnoughWarehouseCapacityErrorBag,
    ...hasEnoughGranaryCapacityErrorBag,
    ...hasHasAvailableBuildingQueueSlotErrorBag,
  ];

  if (isMaxLevel) {
    return {
      errors: [t("Building can't be upgraded any further")],
      variant: 'blue',
    };
  }

  if (isDeveloperModeEnabled) {
    return {
      errors: [],
      variant: 'red',
    };
  }

  const variant: BorderIndicatorBorderVariant = isMaxLevel
    ? 'blue'
    : errorBag.length === 0
      ? 'green'
      : errorBag.includes(t('Not enough resources available.')) ||
          errorBag.includes(t('Building construction queue is full.'))
        ? 'yellow'
        : 'gray';

  return {
    errors: errorBag,
    variant,
  };
};

export const useBuildingUpgradeStatus = (
  buildingField: BuildingField,
): UseBuildingRequirementsReturn => {
  const { buildingId, level, id } = buildingField;

  return useBuildingRequirements(buildingId, level, id);
};

export const useBuildingConstructionStatus = (
  buildingId: Building['id'],
  buildingFieldId: BuildingField['id'],
): UseBuildingRequirementsReturn => {
  return useBuildingRequirements(buildingId, 0, buildingFieldId);
};
