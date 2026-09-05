import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { getBuildingDataForLevel } from '@pillage-first/game-assets/utils/buildings';
import type { Building } from '@pillage-first/types/models/building';
import { CurrentVillageComputedEffectsContext } from 'app/(game)/(village-slug)/providers/current-village-computed-effects-context';

export const getHasEnoughFreeCrop = (
  buildingId: Building['id'],
  populationDifference: number,
  buildingWheatLimit: number,
): boolean => {
  if (buildingId === 'WHEAT_FIELD' || populationDifference === 0) {
    return true;
  }
  return buildingWheatLimit >= populationDifference;
};

export const useHasEnoughFreeCrop = (
  buildingId: Building['id'],
  level: number,
) => {
  const { t } = useTranslation();
  const { computedWheatProductionEffect } = use(
    CurrentVillageComputedEffectsContext,
  );

  const { nextLevelPopulation, population } = getBuildingDataForLevel(
    buildingId,
    level,
  );
  const { buildingWheatLimit } = computedWheatProductionEffect;
  const populationDifference = nextLevelPopulation - population;

  const errorBag: string[] = [];

  if (
    !getHasEnoughFreeCrop(buildingId, populationDifference, buildingWheatLimit)
  ) {
    const missingFreeCrop = Math.abs(buildingWheatLimit - populationDifference);
    errorBag.push(
      t('Your wheat production is too low. Increase it by {{amount}}.', {
        amount: missingFreeCrop,
      }),
    );
  }

  return {
    hasEnoughFreeCrop: errorBag.length === 0,
    errorBag,
  };
};
