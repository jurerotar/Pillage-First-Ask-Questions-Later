import type { BuildingField } from 'app/interfaces/models/game/village';
import { use } from 'react';
import { CurrentVillageContext } from 'app/(game)/providers/current-village-provider';
import { useComputedEffect } from 'app/(game)/hooks/use-computed-effect';
import { CurrentResourceContext } from 'app/(game)/providers/current-resources-provider';
import { useEvents } from 'app/(game)/hooks/use-events';
import { useDeveloperMode } from 'app/(game)/hooks/use-developer-mode';
import { getBuildingDataForLevel } from 'app/(game)/utils/building';
import type { BorderIndicatorBorderVariant } from 'app/(game)/components/border-indicator';
import type { Resources } from 'app/interfaces/models/game/resource';
import { useTranslation } from 'react-i18next';
import type { Building } from 'app/interfaces/models/game/building';

const getHasEnoughFreeCrop = (nextLevelCropConsumption: number, wheatBuildingLimit: number, currentVillagePopulation: number): boolean => {
  return nextLevelCropConsumption > 0 || wheatBuildingLimit - currentVillagePopulation < nextLevelCropConsumption;
};

const getHasEnoughWarehouseCapacity = (calculatedWarehouseCapacity: number, nextLevelResourceCost: number[]): boolean => {
  return nextLevelResourceCost.filter((_, i) => i < 3).every((buildingCost) => buildingCost <= calculatedWarehouseCapacity);
};

const getHasEnoughGranaryCapacity = (calculatedGranaryCapacity: number, nextLevelWheatCost: number) => {
  return calculatedGranaryCapacity >= nextLevelWheatCost;
};

const getHasEnoughResources = (nextLevelResourceCost: number[], currentResources: Resources) => {
  return Object.values(currentResources).every((value, index) => value >= nextLevelResourceCost[index]);
};

export const useBuildingUpgradeStatus = (buildingFieldId: BuildingField['id']) => {
  const { t } = useTranslation();
  const { currentVillage, currentVillagePopulation } = use(CurrentVillageContext);
  const { cumulativeBaseEffectValue: wheatBuildingLimit } = useComputedEffect('wheatProduction');
  const { total: warehouseCapacity } = useComputedEffect('warehouseCapacity');
  const { total: granaryCapacity } = useComputedEffect('granaryCapacity');
  const resources = use(CurrentResourceContext);
  const { getCanAddAdditionalBuildingToQueue } = useEvents();
  const { isDeveloperModeActive } = useDeveloperMode();

  const { buildingId, level } = currentVillage.buildingFields.find(({ id }) => buildingFieldId === id)!;
  const { isMaxLevel, nextLevelResourceCost, nextLevelCropConsumption } = getBuildingDataForLevel(buildingId, level);

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

    if (!getCanAddAdditionalBuildingToQueue(currentVillage, buildingFieldId)) {
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

    if (!getCanAddAdditionalBuildingToQueue(currentVillage, buildingFieldId)) {
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
  const { currentVillage } = use(CurrentVillageContext);
  const { getCurrentVillageBuildingEvents } = useEvents();

  const currentVillageBuildingEvents = getCurrentVillageBuildingEvents(currentVillage);

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
