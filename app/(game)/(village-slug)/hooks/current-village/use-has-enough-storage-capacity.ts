import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { CurrentVillageStateContext } from 'app/(game)/(village-slug)/providers/current-village-state-provider';
import { formatNumber } from 'app/utils/common';

export const getHasEnoughWarehouseCapacity = (
  calculatedWarehouseCapacity: number,
  nextLevelResourceCost: number[],
): boolean => {
  for (let i = 0; i < 3; i++) {
    if (nextLevelResourceCost[i] > calculatedWarehouseCapacity) {
      return false;
    }
  }
  return true;
};

export const getHasEnoughGranaryCapacity = (
  calculatedGranaryCapacity: number,
  nextLevelWheatCost: number,
): boolean => {
  return calculatedGranaryCapacity >= nextLevelWheatCost;
};

export const useHasEnoughStorageCapacity = (
  type: 'warehouseCapacity' | 'granaryCapacity',
  requiredResources: number[],
) => {
  const { t } = useTranslation();
  const { computedWarehouseCapacityEffect, computedGranaryCapacityEffect } =
    use(CurrentVillageStateContext);

  const { total: warehouseCapacity } = computedWarehouseCapacityEffect;
  const { total: granaryCapacity } = computedGranaryCapacityEffect;

  const errorBag: string[] = [];
  let hasEnoughStorageCapacity = true;

  if (type === 'warehouseCapacity') {
    if (!getHasEnoughWarehouseCapacity(warehouseCapacity, requiredResources)) {
      const [wood, clay, iron] = requiredResources;
      const difference = Math.max(wood, clay, iron) - warehouseCapacity;

      errorBag.push(
        t('Your warehouses are too small. You need {{amount}} more capacity.', {
          amount: formatNumber(difference),
        }),
      );

      hasEnoughStorageCapacity = false;
    }
  }

  if (!getHasEnoughGranaryCapacity(granaryCapacity, requiredResources[3])) {
    const difference = requiredResources[3] - warehouseCapacity;

    errorBag.push(
      t('Your granaries are too small. You need {{amount}} more capacity.', {
        amount: formatNumber(difference),
      }),
    );

    hasEnoughStorageCapacity = false;
  }

  return {
    hasEnoughStorageCapacity,
    errorBag,
  };
};
