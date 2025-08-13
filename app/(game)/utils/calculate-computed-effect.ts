import type { Effect, VillageEffect } from 'app/interfaces/models/game/effect';
import type { Village } from 'app/interfaces/models/game/village';

const assignEffectValue = (
  effect: Effect,
  effectValuesRef: EffectValueBreakdown,
): void => {
  switch (effect.type) {
    case 'base': {
      effectValuesRef.base.push(effect.value);
      break;
    }
    case 'bonus': {
      effectValuesRef.bonus += effect.value - 1;
      break;
    }
    case 'bonus-booster': {
      effectValuesRef.bonusBooster += effect.value - 1;
    }
  }
};

type EffectValueBreakdown = {
  base: number[];
  bonus: number;
  bonusBooster: number;
};

type GetEffectBreakdownReturn = {
  serverEffectValue: number;
  buildingEffectValues: EffectValueBreakdown;
  heroEffectValues: EffectValueBreakdown;
  oasisEffectValues: EffectValueBreakdown;
  artifactEffectValues: EffectValueBreakdown;
  troopEffectValues: EffectValueBreakdown;
  combinedBonusEffectValue: number;
};

export const getEffectBreakdown = (
  effectId: Effect['id'],
  effects: Effect[],
  currentVillageId: Village['id'],
): GetEffectBreakdownReturn => {
  let serverEffectValue = 1;

  const buildingEffectValues: EffectValueBreakdown = {
    base: [],
    bonus: 1,
    bonusBooster: 1,
  };

  const heroEffectValues: EffectValueBreakdown = {
    base: [],
    bonus: 1,
    bonusBooster: 1,
  };

  const oasisEffectValues: EffectValueBreakdown = {
    base: [],
    bonus: 1,
    bonusBooster: 1,
  };

  const artifactEffectValues: EffectValueBreakdown = {
    base: [],
    bonus: 1,
    bonusBooster: 1,
  };

  const troopEffectValues: EffectValueBreakdown = {
    base: [],
    bonus: 1,
    bonusBooster: 1,
  };

  for (const effect of effects) {
    if (effect.id !== effectId) {
      continue;
    }

    const shouldEffectApplyToCurrentVillage =
      effect.scope === 'global' ||
      effect.scope === 'server' ||
      (effect as VillageEffect).villageId === currentVillageId;

    if (!shouldEffectApplyToCurrentVillage) {
      continue;
    }

    if (effect.scope === 'server') {
      serverEffectValue = effect.value;
      continue;
    }

    if (effect.source === 'building') {
      assignEffectValue(effect, buildingEffectValues);
      continue;
    }

    if (effect.source === 'hero') {
      assignEffectValue(effect, heroEffectValues);
      continue;
    }

    if (effect.source === 'artifact') {
      assignEffectValue(effect, artifactEffectValues);
      continue;
    }

    if (effect.source === 'oasis') {
      assignEffectValue(effect, oasisEffectValues);
      continue;
    }

    if (effect.source === 'troops') {
      assignEffectValue(effect, troopEffectValues);
    }
  }

  const shouldIncludeBaseMultiplier =
    buildingEffectValues.bonus > 1 ||
    oasisEffectValues.bonus > 1 ||
    artifactEffectValues.bonus > 1 ||
    heroEffectValues.bonus > 1 ||
    troopEffectValues.bonus > 1;

  const startingValue = shouldIncludeBaseMultiplier ? 1 : 0;

  const combinedBonusEffectValue =
    startingValue +
      (buildingEffectValues.bonus - 1) * buildingEffectValues.bonusBooster +
      (oasisEffectValues.bonus - 1) * oasisEffectValues.bonusBooster +
      (artifactEffectValues.bonus - 1) * artifactEffectValues.bonusBooster +
      (heroEffectValues.bonus - 1) * heroEffectValues.bonusBooster +
      (troopEffectValues.bonus - 1) * troopEffectValues.bonusBooster || 1;

  return {
    serverEffectValue,
    buildingEffectValues,
    oasisEffectValues,
    artifactEffectValues,
    heroEffectValues,
    troopEffectValues,
    combinedBonusEffectValue,
  };
};

export type ComputedEffectReturn = {
  total: number;
};

export type WheatProductionEffectReturn = ComputedEffectReturn & {
  population: number;
  buildingWheatLimit: number;
};

export function calculateComputedEffect(
  effectId: 'wheatProduction',
  effects: Effect[],
  currentVillageId: Village['id'],
): WheatProductionEffectReturn;

export function calculateComputedEffect(
  effectId: Effect['id'],
  effects: Effect[],
  currentVillageId: Village['id'],
): ComputedEffectReturn;

export function calculateComputedEffect(
  effectId: Effect['id'],
  effects: Effect[],
  currentVillageId: Village['id'],
): ComputedEffectReturn | WheatProductionEffectReturn {
  const effectBreakdown = getEffectBreakdown(
    effectId,
    effects,
    currentVillageId,
  );

  if (effectId === 'wheatProduction') {
    const unitWheatConsumptionBreakdown = getEffectBreakdown(
      'unitWheatConsumption',
      effects,
      currentVillageId,
    );

    let summedHeroEffectBaseValue = 0;

    for (const value of effectBreakdown.heroEffectValues.base) {
      summedHeroEffectBaseValue += value;
    }

    let summedArtifactEffectBaseValue = 0;

    for (const value of effectBreakdown.artifactEffectValues.base) {
      summedArtifactEffectBaseValue += value;
    }

    let summedOasisEffectBaseValue = 0;

    for (const value of effectBreakdown.oasisEffectValues.base) {
      summedOasisEffectBaseValue += value;
    }

    let summedTroopEffectBaseValue = 0;

    for (const value of effectBreakdown.troopEffectValues.base) {
      summedTroopEffectBaseValue += value;
    }

    let summedBuildingEffectBasePositiveValue = 0;
    let summedBuildingEffectBaseNegativeValue = 0;

    for (const value of effectBreakdown.buildingEffectValues.base) {
      if (value < 0) {
        summedBuildingEffectBaseNegativeValue += value;
        continue;
      }

      summedBuildingEffectBasePositiveValue += Math.trunc(
        value *
          effectBreakdown.serverEffectValue *
          effectBreakdown.combinedBonusEffectValue,
      );
    }

    const total =
      summedBuildingEffectBasePositiveValue +
      summedBuildingEffectBaseNegativeValue +
      summedArtifactEffectBaseValue +
      summedOasisEffectBaseValue +
      summedHeroEffectBaseValue -
      Math.trunc(
        summedTroopEffectBaseValue *
          unitWheatConsumptionBreakdown.combinedBonusEffectValue,
      );

    return {
      total,
      population: -summedBuildingEffectBaseNegativeValue,
      buildingWheatLimit: total + summedBuildingEffectBaseNegativeValue,
    };
  }

  const isBaseBuildingValueABaseValue =
    effectBreakdown.buildingEffectValues.base.length > 0;

  if (isBaseBuildingValueABaseValue) {
    let summedHeroEffectBaseValue = 0;

    for (const value of effectBreakdown.heroEffectValues.base) {
      summedHeroEffectBaseValue += value;
    }

    let summedArtifactEffectBaseValue = 0;

    for (const value of effectBreakdown.artifactEffectValues.base) {
      summedArtifactEffectBaseValue += value;
    }

    let summedOasisEffectBaseValue = 0;

    for (const value of effectBreakdown.oasisEffectValues.base) {
      summedOasisEffectBaseValue += value;
    }

    let summedBuildingEffectBaseValue = 0;

    for (const value of effectBreakdown.buildingEffectValues.base) {
      summedBuildingEffectBaseValue += Math.trunc(
        value *
          effectBreakdown.serverEffectValue *
          effectBreakdown.combinedBonusEffectValue,
      );
    }

    const total =
      summedBuildingEffectBaseValue +
      summedArtifactEffectBaseValue +
      summedOasisEffectBaseValue +
      summedHeroEffectBaseValue;

    return {
      total,
    };
  }

  return {
    total:
      effectBreakdown.combinedBonusEffectValue *
      effectBreakdown.serverEffectValue,
  };
}
