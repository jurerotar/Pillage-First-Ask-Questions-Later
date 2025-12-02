import type { Resources } from 'app/interfaces/models/game/resource';
import { use } from 'react';
import { CurrentVillageStateContext } from 'app/(game)/(village-slug)/providers/current-village-state-provider';
import { useTranslation } from 'react-i18next';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { formatNumber } from 'app/utils/common';

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
  const { preferences } = usePreferences();
  const { wood, clay, iron, wheat } = use(CurrentVillageStateContext);

  const resources = { wood, clay, iron, wheat };

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

    const lf = new Intl.ListFormat(preferences.locale, {
      style: 'long',
      type: 'conjunction',
    });

    const errorMessage = t(
      'Not enough resources available. You are still missing {{resources}}.',
      { resources: lf.format(missingResources) },
    );

    errorBag.push(errorMessage);
  }

  return {
    hasEnoughResources: errorBag.length === 0,
    errorBag,
  };
};
