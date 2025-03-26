import type { BuildingField } from 'app/interfaces/models/game/village';
import { use } from 'react';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useComputedEffect } from 'app/(game)/(village-slug)/hooks/use-computed-effect';
import { CurrentResourceContext } from 'app/(game)/(village-slug)/providers/current-resources-provider';
import { useDeveloperMode } from 'app/(game)/(village-slug)/hooks/use-developer-mode';
import { getBuildingDataForLevel } from 'app/(game)/(village-slug)/utils/building';
import type { BorderIndicatorBorderVariant } from 'app/(game)/(village-slug)/components/border-indicator';
import type { Resources } from 'app/interfaces/models/game/resource';
import { useTranslation } from 'react-i18next';
import type { Building } from 'app/interfaces/models/game/building';
import { useCurrentVillageBuildingEvents } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village-building-events';
import { useCurrentVillageBuildingEventQueue } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village-building-event-queue';

export const getHasEnoughFreeCrop = (
  nextLevelCropConsumption: number,
  wheatBuildingLimit: number,
  currentVillagePopulation: number,
): boolean => {
  if (nextLevelCropConsumption === 0) {
    return true;
  }
  return wheatBuildingLimit - currentVillagePopulation >= nextLevelCropConsumption;
};

export const getHasEnoughWarehouseCapacity = (calculatedWarehouseCapacity: number, nextLevelResourceCost: number[]): boolean => {
  return nextLevelResourceCost.filter((_, i) => i < 3).every((buildingCost) => buildingCost <= calculatedWarehouseCapacity);
};

export const getHasEnoughGranaryCapacity = (calculatedGranaryCapacity: number, nextLevelWheatCost: number) => {
  return calculatedGranaryCapacity >= nextLevelWheatCost;
};

export const getHasEnoughResources = (nextLevelResourceCost: number[], currentResources: Resources) => {
  return Object.values(currentResources).every((value, index) => value >= nextLevelResourceCost[index]);
};

export const useBuildingConstructionStatus = (buildingId: Building['id'], buildingFieldId: BuildingField['id']) => {
  const { t } = useTranslation();
  const { getCurrentVillagePopulation } = useCurrentVillage();
  const { cumulativeBaseEffectValue: wheatBuildingLimit } = useComputedEffect('wheatProduction');
  const { total: warehouseCapacity } = useComputedEffect('warehouseCapacity');
  const { total: granaryCapacity } = useComputedEffect('granaryCapacity');
  const resources = use(CurrentResourceContext);
  const { canAddAdditionalBuildingToQueue } = useCurrentVillageBuildingEventQueue(buildingFieldId);
  const { isDeveloperModeActive } = useDeveloperMode();

  const { nextLevelResourceCost, nextLevelCropConsumption } = getBuildingDataForLevel(buildingId, 1);

  const getBuildingConstructionErrorBag = (): string[] => {
    const errorBag: string[] = [];

    if (isDeveloperModeActive) {
      return [];
    }

    const currentVillagePopulation = getCurrentVillagePopulation();

    if (!getHasEnoughFreeCrop(nextLevelCropConsumption, wheatBuildingLimit, currentVillagePopulation)) {
      errorBag.push(t('Upgrade wheat fields first'));
    }

    if (!getHasEnoughWarehouseCapacity(warehouseCapacity, nextLevelResourceCost)) {
      errorBag.push(t('Upgrade warehouse first'));
    }

    if (!getHasEnoughGranaryCapacity(granaryCapacity, nextLevelResourceCost[3])) {
      errorBag.push(t('Upgrade granary first'));
    }

    if (!getHasEnoughResources(nextLevelResourceCost, resources)) {
      errorBag.push(t('Not enough resources available'));
    }

    if (!canAddAdditionalBuildingToQueue) {
      errorBag.push(t('Building queue is full'));
    }

    return errorBag;
  };

  return {
    getBuildingConstructionErrorBag,
  };
};

export const useBuildingUpgradeStatus = (buildingFieldId: BuildingField['id']) => {
  const { t } = useTranslation();
  const { currentVillage, getCurrentVillagePopulation } = useCurrentVillage();
  const { cumulativeBaseEffectValue: wheatBuildingLimit } = useComputedEffect('wheatProduction');
  const { total: warehouseCapacity } = useComputedEffect('warehouseCapacity');
  const { total: granaryCapacity } = useComputedEffect('granaryCapacity');
  const resources = use(CurrentResourceContext);
  const { canAddAdditionalBuildingToQueue } = useCurrentVillageBuildingEventQueue(buildingFieldId);
  const { isDeveloperModeActive } = useDeveloperMode();

  const { buildingId, level } = currentVillage.buildingFields.find(({ id }) => buildingFieldId === id)!;
  const { isMaxLevel, nextLevelResourceCost, nextLevelCropConsumption } = getBuildingDataForLevel(buildingId, level);
  const currentVillagePopulation = getCurrentVillagePopulation();

  const getBuildingUpgradeIndicatorVariant = (): BorderIndicatorBorderVariant => {
    if (isMaxLevel) {
      return 'blue';
    }

    if (isDeveloperModeActive) {
      return 'red';
    }

    if (!getHasEnoughFreeCrop(nextLevelCropConsumption, wheatBuildingLimit, currentVillagePopulation)) {
      return 'gray';
    }

    if (!getHasEnoughWarehouseCapacity(warehouseCapacity, nextLevelResourceCost)) {
      return 'gray';
    }

    if (!getHasEnoughGranaryCapacity(granaryCapacity, nextLevelResourceCost[3])) {
      return 'gray';
    }

    if (!getHasEnoughResources(nextLevelResourceCost, resources)) {
      return 'yellow';
    }

    if (!canAddAdditionalBuildingToQueue) {
      return 'yellow';
    }

    return 'green';
  };

  const getBuildingUpgradeErrorBag = (): string[] => {
    const errorBag: string[] = [];

    if (isMaxLevel) {
      return [t("Building can't be upgraded any further")];
    }

    if (isDeveloperModeActive) {
      return [];
    }

    if (!getHasEnoughFreeCrop(nextLevelCropConsumption, wheatBuildingLimit, currentVillagePopulation)) {
      errorBag.push(t('Upgrade wheat fields first'));
    }

    if (!getHasEnoughWarehouseCapacity(warehouseCapacity, nextLevelResourceCost)) {
      errorBag.push(t('Upgrade warehouse first'));
    }

    if (!getHasEnoughGranaryCapacity(granaryCapacity, nextLevelResourceCost[3])) {
      errorBag.push(t('Upgrade granary first'));
    }

    if (!getHasEnoughResources(nextLevelResourceCost, resources)) {
      errorBag.push(t('Not enough resources available'));
    }

    if (!canAddAdditionalBuildingToQueue) {
      errorBag.push(t('Building queue is full'));
    }

    return errorBag;
  };

  return {
    getBuildingUpgradeIndicatorVariant,
    getBuildingUpgradeErrorBag,
  };
};

export const useBuildingDowngradeStatus = (buildingId: Building['id']) => {
  const { t } = useTranslation();
  const { currentVillageBuildingEvents } = useCurrentVillageBuildingEvents();

  const getBuildingDowngradeErrorBag = (): string[] => {
    const errorBag: string[] = [];

    if (currentVillageBuildingEvents.some(({ building }) => building.id === buildingId)) {
      errorBag.push(t("Building can't be downgraded or demolished while it's being upgraded"));
    }

    return errorBag;
  };

  return {
    getBuildingDowngradeErrorBag,
  };
};
