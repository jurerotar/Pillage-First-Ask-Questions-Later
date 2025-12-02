import { getBuildingDataForLevel } from 'app/assets/utils/buildings';
import type { Building } from 'app/interfaces/models/game/building';
import { use } from 'react';
import { CurrentVillageStateContext } from 'app/(game)/(village-slug)/providers/current-village-state-provider';
import { useTranslation } from 'react-i18next';

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
