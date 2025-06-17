import type { BuildingField } from 'app/interfaces/models/game/village';
import { use, useMemo } from 'react';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { CurrentVillageStateContext } from 'app/(game)/(village-slug)/providers/current-village-state-provider';
import { useDeveloperMode } from 'app/(game)/(village-slug)/hooks/use-developer-mode';
import { getBuildingDataForLevel } from 'app/(game)/(village-slug)/utils/building';
import type { BorderIndicatorBorderVariant } from 'app/(game)/(village-slug)/components/border-indicator';
import type { Resources } from 'app/interfaces/models/game/resource';
import { useTranslation } from 'react-i18next';
import type { Building } from 'app/interfaces/models/game/building';
import { useCurrentVillageBuildingEvents } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village-building-events';
import { useCurrentVillageBuildingEventQueue } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village-building-event-queue';

export const getHasEnoughFreeCrop = (
  nextLevelWheatConsumption: number,
  buildingWheatLimit: number,
): boolean => {
  if (nextLevelWheatConsumption === 0) {
    return true;
  }
  return buildingWheatLimit >= nextLevelWheatConsumption;
};

export const getHasEnoughWarehouseCapacity = (
  calculatedWarehouseCapacity: number,
  nextLevelResourceCost: number[],
): boolean => {
  return nextLevelResourceCost
    .filter((_, i) => i < 3)
    .every((buildingCost) => buildingCost <= calculatedWarehouseCapacity);
};

export const getHasEnoughGranaryCapacity = (
  calculatedGranaryCapacity: number,
  nextLevelWheatCost: number,
): boolean => {
  return calculatedGranaryCapacity >= nextLevelWheatCost;
};

export const getHasEnoughResources = (
  nextLevelResourceCost: number[],
  currentResources: Resources,
): boolean => {
  return Object.values(currentResources).every(
    (value, index) => value >= nextLevelResourceCost[index],
  );
};

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
  const {
    computedGranaryCapacityEffect,
    computedWarehouseCapacityEffect,
    computedWheatProductionEffect,
    wood,
    clay,
    iron,
    wheat,
  } = use(CurrentVillageStateContext);
  const { isDeveloperModeEnabled } = useDeveloperMode();
  const { canAddAdditionalBuildingToQueue } =
    useCurrentVillageBuildingEventQueue(buildingFieldId);

  const { buildingWheatLimit } = computedWheatProductionEffect;
  const { total: warehouseCapacity } = computedWarehouseCapacityEffect;
  const { total: granaryCapacity } = computedGranaryCapacityEffect;

  const { isMaxLevel, nextLevelResourceCost, nextLevelWheatConsumption } =
    getBuildingDataForLevel(buildingId, level);

  const resources = useMemo(() => {
    return {
      wood,
      clay,
      iron,
      wheat,
    };
  }, [wheat, iron, clay, wood]);

  const requirements = useMemo(() => {
    if (isMaxLevel) {
      return {
        errors: [t("Building can't be upgraded any further")],
        variant: 'blue',
      } satisfies UseBuildingRequirementsReturn;
    }

    if (isDeveloperModeEnabled) {
      return {
        errors: [],
        variant: 'red',
      } satisfies UseBuildingRequirementsReturn;
    }

    const errors: string[] = [];

    if (!getHasEnoughFreeCrop(nextLevelWheatConsumption, buildingWheatLimit)) {
      errors.push(t('Upgrade wheat fields first'));
    }

    if (
      !getHasEnoughWarehouseCapacity(warehouseCapacity, nextLevelResourceCost)
    ) {
      errors.push(t('Upgrade warehouse first'));
    }

    if (
      !getHasEnoughGranaryCapacity(granaryCapacity, nextLevelResourceCost[3])
    ) {
      errors.push(t('Upgrade granary first'));
    }

    if (!getHasEnoughResources(nextLevelResourceCost, resources)) {
      errors.push(t('Not enough resources available'));
    }

    if (!canAddAdditionalBuildingToQueue) {
      errors.push(t('Building queue is full'));
    }

    const variant: BorderIndicatorBorderVariant = isMaxLevel
      ? 'blue'
      : errors.length === 0
        ? 'green'
        : errors.includes(t('Not enough resources available')) ||
            errors.includes(t('Building queue is full'))
          ? 'yellow'
          : 'gray';

    return {
      errors,
      variant,
    };
  }, [
    isMaxLevel,
    isDeveloperModeEnabled,
    nextLevelWheatConsumption,
    buildingWheatLimit,
    warehouseCapacity,
    granaryCapacity,
    nextLevelResourceCost,
    canAddAdditionalBuildingToQueue,
    resources,
    t,
  ]);

  return requirements;
};

export const useBuildingUpgradeStatus = (
  buildingFieldId: BuildingField['id'],
): UseBuildingRequirementsReturn => {
  const { currentVillage } = useCurrentVillage();
  const { buildingId, level } = currentVillage.buildingFields.find(
    ({ id }) => id === buildingFieldId,
  )!;

  return useBuildingRequirements(buildingId, level, buildingFieldId);
};

export const useBuildingConstructionStatus = (
  buildingId: Building['id'],
  buildingFieldId: BuildingField['id'],
): UseBuildingRequirementsReturn => {
  return useBuildingRequirements(buildingId, 1, buildingFieldId);
};

export const useBuildingDowngradeStatus = (
  buildingFieldId: BuildingField['id'],
) => {
  const { t } = useTranslation();
  const { currentVillageBuildingEvents } = useCurrentVillageBuildingEvents();

  const getBuildingDowngradeErrorBag = (): string[] => {
    const errorBag: string[] = [];

    if (
      currentVillageBuildingEvents.some(
        ({ buildingFieldId: eventBuildingFieldId }) =>
          eventBuildingFieldId === buildingFieldId,
      )
    ) {
      errorBag.push(
        t(
          "Building can't be downgraded or demolished while it's being upgraded",
        ),
      );
    }

    return errorBag;
  };

  return {
    getBuildingDowngradeErrorBag,
  };
};
