import { use } from 'react';
import { useTranslation } from 'react-i18next';
import type { Resources } from '@pillage-first/types/models/resource';
import { formatNumber } from '@pillage-first/utils/format';
import { useCountdown } from 'app/(game)/(village-slug)/hooks/use-countdown';
import { CurrentVillageComputedEffectsContext } from 'app/(game)/(village-slug)/providers/current-village-computed-effects-context';
import { CurrentVillageLiveResourcesContext } from 'app/(game)/(village-slug)/providers/current-village-live-resources-context';
import { useIntl } from 'app/hooks/use-intl';
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

type GetResourcesReadyInHoursArgs = {
  requiredResources: number[];
  currentResources: Resources;
  hourlyProductions: number[];
};

export const getResourcesReadyInHours = ({
  requiredResources,
  currentResources,
  hourlyProductions,
}: GetResourcesReadyInHoursArgs): number | null => {
  if (hourlyProductions.some((hourlyProduction) => hourlyProduction < 0)) {
    return null;
  }

  const currentResourceAmounts = [
    currentResources.wood,
    currentResources.clay,
    currentResources.iron,
    currentResources.wheat,
  ];

  const waitTimes: number[] = [];

  for (const [index, requiredResourceAmount] of requiredResources.entries()) {
    const resourceDiff = requiredResourceAmount - currentResourceAmounts[index];

    if (resourceDiff <= 0) {
      waitTimes.push(0);
      continue;
    }

    const hourlyProduction = hourlyProductions[index];

    if (hourlyProduction <= 0) {
      return null;
    }

    waitTimes.push(resourceDiff / hourlyProduction);
  }

  return Math.max(...waitTimes);
};

export const useHasEnoughResources = (requiredResources: number[]) => {
  const { t } = useTranslation();
  const currentTimestamp = useCountdown();
  const { wood, clay, iron, wheat } = use(CurrentVillageLiveResourcesContext);
  const {
    hourlyWoodProduction,
    hourlyClayProduction,
    hourlyIronProduction,
    hourlyWheatProduction,
    computedWarehouseCapacityEffect,
    computedGranaryCapacityEffect,
  } = use(CurrentVillageComputedEffectsContext);
  const intl = useIntl();

  const { total: warehouseCapacity } = computedWarehouseCapacityEffect;
  const { total: granaryCapacity } = computedGranaryCapacityEffect;

  const errorBag: string[] = [];

  if (!getHasEnoughResources(requiredResources, { wood, clay, iron, wheat })) {
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

    const errorMessage = t(
      'Not enough resources available. You are still missing {{resources}}.',
      { resources: intl.list.format(missingResources) },
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
      const readyInHours = getResourcesReadyInHours({
        requiredResources,
        currentResources: { wood, clay, iron, wheat },
        hourlyProductions: [
          hourlyWoodProduction,
          hourlyClayProduction,
          hourlyIronProduction,
          hourlyWheatProduction,
        ],
      });

      if (readyInHours !== null && readyInHours > 0) {
        const readyAtTimestamp =
          currentTimestamp + readyInHours * 60 * 60 * 1000;
        const { isToday, formattedDate } = formatFutureTimestamp(
          readyAtTimestamp,
          currentTimestamp,
          intl,
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
