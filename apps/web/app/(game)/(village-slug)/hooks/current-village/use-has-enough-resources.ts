import { use } from 'react';
import { useTranslation } from 'react-i18next';
import type { Resources } from '@pillage-first/types/models/resource';
import { formatNumber } from '@pillage-first/utils/format';
import { CurrentVillageStateContext } from 'app/(game)/(village-slug)/providers/current-village-state-provider';
import { CookieContext } from 'app/providers/cookie-provider';
import { formatFutureTimestamp } from 'app/utils/time';
import {
  getHasEnoughGranaryCapacity,
  getHasEnoughWarehouseCapacity,
} from './use-has-enough-storage-capacity';

export const getHasEnoughResources = (
  nextLevelResourceCost: number[],
  currentResources: Resources,
): boolean => {
  return (
    currentResources.wood >= nextLevelResourceCost[0] &&
    currentResources.clay >= nextLevelResourceCost[1] &&
    currentResources.iron >= nextLevelResourceCost[2] &&
    currentResources.wheat >= nextLevelResourceCost[3]
  );
};

export const useHasEnoughResources = (requiredResources: number[]) => {
  const { t } = useTranslation();
  const {
    wood,
    clay,
    iron,
    wheat,
    hourlyWoodProduction,
    hourlyClayProduction,
    hourlyIronProduction,
    hourlyWheatProduction,
    computedWarehouseCapacityEffect,
    computedGranaryCapacityEffect,
  } = use(CurrentVillageStateContext);
  const { locale } = use(CookieContext);

  const resources = { wood, clay, iron, wheat };

  const { total: warehouseCapacity } = computedWarehouseCapacityEffect;
  const { total: granaryCapacity } = computedGranaryCapacityEffect;

  const errorBag: string[] = [];

  if (!getHasEnoughResources(requiredResources, resources)) {
    const { wood, clay, iron, wheat } = resources;
    const [nextLevelWood, nextLevelClay, nextLevelIron, nextLevelWheat] =
      requiredResources;

    const [woodDiff, clayDiff, ironDiff, wheatDiff] = [
      nextLevelWood - wood,
      nextLevelClay - clay,
      nextLevelIron - iron,
      nextLevelWheat - wheat,
    ];

    const missingResources: string[] = [];

    if (woodDiff > 0) {
      missingResources.push(
        t('{{amount}} wood', { amount: formatNumber(woodDiff) }),
      );
    }

    if (clayDiff > 0) {
      missingResources.push(
        t('{{amount}} clay', { amount: formatNumber(clayDiff) }),
      );
    }

    if (ironDiff > 0) {
      missingResources.push(
        t('{{amount}} iron', { amount: formatNumber(ironDiff) }),
      );
    }

    if (wheatDiff > 0) {
      missingResources.push(
        t('{{amount}} wheat', { amount: formatNumber(wheatDiff) }),
      );
    }

    const lf = new Intl.ListFormat(locale, {
      style: 'long',
      type: 'conjunction',
    });

    const errorMessage = t(
      'Not enough resources available. You are still missing {{resources}}.',
      { resources: lf.format(missingResources) },
    );

    errorBag.push(errorMessage);

    const isWarehouseCapacityEnough = getHasEnoughWarehouseCapacity(
      warehouseCapacity,
      requiredResources,
    );
    const isGranaryCapacityEnough = getHasEnoughGranaryCapacity(
      granaryCapacity,
      requiredResources[3],
    );

    if (isWarehouseCapacityEnough && isGranaryCapacityEnough) {
      const waitTimes = [
        woodDiff > 0 && hourlyWoodProduction > 0
          ? woodDiff / hourlyWoodProduction
          : 0,
        clayDiff > 0 && hourlyClayProduction > 0
          ? clayDiff / hourlyClayProduction
          : 0,
        ironDiff > 0 && hourlyIronProduction > 0
          ? ironDiff / hourlyIronProduction
          : 0,
        wheatDiff > 0 && hourlyWheatProduction > 0
          ? wheatDiff / hourlyWheatProduction
          : 0,
      ];

      const maxWaitTimeInHours = Math.max(...waitTimes);
      const readyAtTimestamp = Date.now() + maxWaitTimeInHours * 60 * 60 * 1000;

      if (maxWaitTimeInHours > 0) {
        const { isToday, formattedDate } = formatFutureTimestamp(
          readyAtTimestamp,
          locale,
        );

        errorBag.push(
          t(
            isToday
              ? 'Enough resources will be available at {{formattedDate}}.'
              : 'Enough resources will be available on {{formattedDate}}.',
            {
              formattedDate,
            },
          ),
        );
      }
    }
  }

  return {
    hasEnoughResources: errorBag.length === 0,
    errorBag,
  };
};
