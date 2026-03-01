import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { getBuildingDataForLevel } from '@pillage-first/game-assets/utils/buildings';
import type { Building } from '@pillage-first/types/models/building';
import { CurrentVillageStateContext } from 'app/(game)/(village-slug)/providers/current-village-state-provider';

export const getHasEnoughFreeCrop = (
  populationDifference: number,
  buildingWheatLimit: number,
): boolean => {
  if (populationDifference === 0) {
    return true;
  }
  return buildingWheatLimit >= populationDifference;
};

export const useHasEnoughFreeCrop = (
  buildingId: Building['id'],
  level: number,
) => {
  const { t } = useTranslation();
  const { computedWheatProductionEffect } = use(CurrentVillageStateContext);

  const { nextLevelPopulation, population } = getBuildingDataForLevel(
    buildingId,
    level,
  );
  const { buildingWheatLimit } = computedWheatProductionEffect;
  const populationDifference = nextLevelPopulation - population;

  const errorBag: string[] = [];

  if (!getHasEnoughFreeCrop(populationDifference, buildingWheatLimit)) {
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
