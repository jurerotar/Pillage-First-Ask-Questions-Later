import type { Effect, VillageEffect } from 'app/interfaces/models/game/effect';
import type { Village } from 'app/interfaces/models/game/village';
import { normalizeForcedFloatValue } from 'app/utils/common';

export type ComputedEffectReturn = {
  serverEffectValue: number;
  buildingEffectBaseValues: number[];
  buildingEffectBonusValue: number;
  heroEffectBaseValue: number;
  heroEffectBonusValue: number;
  oasisEffectBaseValue: number;
  oasisEffectBonusValue: number;
  oasisBoosterEffectBonusValue: number;
  artifactEffectBaseValue: number;
  artifactEffectBonusValue: number;
  total: number;
};

export const calculateComputedEffect = (
  effectId: Effect['id'],
  effects: Effect[],
  currentVillageId: Village['id'],
): ComputedEffectReturn => {
  if (effectId === 'wheatProduction') {
    return calculateWheatProductionEffect(
      'wheatProduction',
      effects,
      currentVillageId,
    );
  }

  let serverEffectValue = 1;

  const buildingEffectBaseValues = [];
  let heroEffectBaseValue = 0;
  let oasisEffectBaseValue = 0;
  let artifactEffectBaseValue = 0;

  // Buildings like sawmill & granary that boost production by %
  let buildingEffectBonusValue = 1;
  // Hero effects that increase production by %
  let heroEffectBonusValue = 1;
  // Oasis effects that increase production by %
  let oasisEffectBonusValue = 1;
  // Effects that increase oasis effects by an additional %
  let oasisBoosterEffectBonusValue = 1;
  // Artifact effects that increase production by %
  let artifactEffectBonusValue = 1;

  const oasisBonusEffectName = `${effectId}OasisBonus`;

  for (const effect of effects) {
    if (effect.id !== effectId && effect.id !== oasisBonusEffectName) {
      continue;
    }

    const shouldEffectApplyToCurrentVillage =
      effect.scope === 'global' ||
      effect.scope === 'server' ||
      (effect as VillageEffect).villageId === currentVillageId;

    if (!shouldEffectApplyToCurrentVillage) {
      continue;
    }

    if (effect.id === oasisBonusEffectName) {
      // oasisBoosterEffectBonusValue is cumulative, so only take the decimal part
      oasisBoosterEffectBonusValue +=
        normalizeForcedFloatValue(effect.value) - 1;
      continue;
    }

    if (effect.scope === 'server') {
      serverEffectValue = effect.value;
      continue;
    }

    if (effect.source === 'hero') {
      if (Number.isInteger(effect.value)) {
        heroEffectBaseValue += effect.value;
        continue;
      }

      heroEffectBonusValue += normalizeForcedFloatValue(effect.value) - 1;
      continue;
    }

    if (effect.source === 'building') {
      if (Number.isInteger(effect.value)) {
        buildingEffectBaseValues.push(effect.value);
        continue;
      }

      buildingEffectBonusValue += normalizeForcedFloatValue(effect.value) - 1;
      continue;
    }

    if (effect.source === 'artifact') {
      if (Number.isInteger(effect.value)) {
        artifactEffectBaseValue += effect.value;
        continue;
      }

      artifactEffectBonusValue += normalizeForcedFloatValue(effect.value) - 1;
      continue;
    }

    if (effect.source === 'oasis') {
      if (Number.isInteger(effect.value)) {
        oasisEffectBaseValue += effect.value;
        continue;
      }

      oasisEffectBonusValue += normalizeForcedFloatValue(effect.value) - 1;
    }
  }

  const isBaseBuildingValueABaseValue = buildingEffectBaseValues.length > 0;

  let total: number;

  const combinedBonusEffectValue =
    1 +
    (buildingEffectBonusValue - 1) +
    (oasisEffectBonusValue - 1) * oasisBoosterEffectBonusValue +
    (artifactEffectBonusValue - 1);

  if (isBaseBuildingValueABaseValue) {
    let summedBuildingEffectBaseValue = 0;

    for (const value of buildingEffectBaseValues) {
      summedBuildingEffectBaseValue += Math.trunc(
        value * serverEffectValue * combinedBonusEffectValue,
      );
    }

    total =
      summedBuildingEffectBaseValue +
      artifactEffectBaseValue +
      oasisEffectBaseValue +
      heroEffectBaseValue;
  } else {
    total = combinedBonusEffectValue;
  }

  return {
    serverEffectValue,
    buildingEffectBaseValues,
    buildingEffectBonusValue,
    heroEffectBaseValue,
    heroEffectBonusValue,
    oasisEffectBaseValue,
    oasisEffectBonusValue,
    oasisBoosterEffectBonusValue,
    artifactEffectBaseValue,
    artifactEffectBonusValue,
    total,
  };
};

export type WheatProductionEffectReturn = ComputedEffectReturn & {
  buildingEffectBaseValueReduction: number;
  troopEffectBaseValueReduction: number;
  troopEffectBonusValueReduction: number;
  buildingWheatLimit: number;
};

export const calculateWheatProductionEffect = (
  _effectId: 'wheatProduction',
  effects: Effect[],
  currentVillageId: Village['id'],
): WheatProductionEffectReturn => {
  let serverEffectValue = 1;

  const buildingEffectBaseValues = [];
  let heroEffectBaseValue = 0;
  let oasisEffectBaseValue = 0;
  let artifactEffectBaseValue = 0;

  // Buildings like sawmill & granary that boost production by %
  let buildingEffectBonusValue = 1;
  // Hero effects that increase production by %
  let heroEffectBonusValue = 1;
  // Oasis effects that increase production by %
  let oasisEffectBonusValue = 1;
  // Effects that increase oasis effects by an additional %
  let oasisBoosterEffectBonusValue = 1;
  // Artifact effects that increase production by %
  let artifactEffectBonusValue = 1;

  let buildingEffectBaseValueReduction = 0;
  let troopEffectBaseValueReduction = 0;

  let troopEffectBonusValueReduction = 1;

  for (const effect of effects) {
    if (
      effect.id !== 'wheatProduction' &&
      effect.id !== 'wheatProductionOasisBonus' &&
      effect.id !== 'unitWheatConsumption'
    ) {
      continue;
    }

    const shouldEffectApplyToCurrentVillage =
      effect.scope === 'global' ||
      effect.scope === 'server' ||
      (effect as VillageEffect).villageId === currentVillageId;

    if (!shouldEffectApplyToCurrentVillage) {
      continue;
    }

    if (effect.id === 'unitWheatConsumption') {
      troopEffectBonusValueReduction *= normalizeForcedFloatValue(effect.value);
      continue;
    }

    if (effect.id === 'wheatProductionOasisBonus') {
      // oasisBoosterEffectBonusValue is cumulative, so only take the decimal part
      oasisBoosterEffectBonusValue *= normalizeForcedFloatValue(
        effect.value % 1,
      );
      continue;
    }

    if (effect.source === 'troops') {
      troopEffectBaseValueReduction += effect.value;
      continue;
    }

    if (effect.scope === 'server') {
      serverEffectValue = effect.value;
      continue;
    }

    if (effect.source === 'hero') {
      if (Number.isInteger(effect.value)) {
        heroEffectBaseValue += effect.value;
        continue;
      }

      heroEffectBonusValue *= normalizeForcedFloatValue(effect.value);
      continue;
    }

    if (effect.source === 'building') {
      if (Number.isInteger(effect.value)) {
        if (effect.value > 0) {
          buildingEffectBaseValues.push(effect.value);
          continue;
        }

        buildingEffectBaseValueReduction += effect.value;
        continue;
      }

      buildingEffectBonusValue *= normalizeForcedFloatValue(effect.value);
      continue;
    }

    if (effect.source === 'artifact') {
      if (Number.isInteger(effect.value)) {
        artifactEffectBaseValue += effect.value;
        continue;
      }

      artifactEffectBonusValue *= normalizeForcedFloatValue(effect.value);
      continue;
    }

    if (effect.source === 'oasis') {
      if (Number.isInteger(effect.value)) {
        oasisEffectBaseValue += effect.value;
        continue;
      }

      oasisEffectBonusValue *= normalizeForcedFloatValue(effect.value);
    }
  }

  const buildingEffectBaseValuesWithServerModifier = [];
  let summedBuildingEffectValuesBaseWithServerModifier = 0;

  for (const value of buildingEffectBaseValues) {
    const multipliedValue = value * serverEffectValue;
    buildingEffectBaseValuesWithServerModifier.push(multipliedValue);
    summedBuildingEffectValuesBaseWithServerModifier += multipliedValue;
  }

  const buildingWheatLimit =
    summedBuildingEffectValuesBaseWithServerModifier -
    buildingEffectBaseValueReduction;

  const combinedBonusEffectValue =
    1 +
    (buildingEffectBonusValue - 1) +
    (oasisEffectBonusValue - 1) * oasisBoosterEffectBonusValue +
    (artifactEffectBonusValue - 1);

  let summedBuildingEffectValuesBaseWithCombinedBonus = 0;

  for (const value of buildingEffectBaseValues) {
    const multipliedValue = value * combinedBonusEffectValue;
    summedBuildingEffectValuesBaseWithCombinedBonus += multipliedValue;
  }

  const total =
    summedBuildingEffectValuesBaseWithCombinedBonus +
    artifactEffectBaseValue +
    oasisEffectBaseValue +
    heroEffectBaseValue +
    buildingEffectBaseValueReduction -
    troopEffectBaseValueReduction * troopEffectBonusValueReduction;

  return {
    serverEffectValue,
    buildingEffectBaseValues,
    buildingEffectBonusValue,
    heroEffectBaseValue,
    heroEffectBonusValue,
    oasisEffectBaseValue,
    oasisEffectBonusValue,
    oasisBoosterEffectBonusValue,
    artifactEffectBaseValue,
    artifactEffectBonusValue,
    buildingEffectBaseValueReduction,
    troopEffectBaseValueReduction,
    troopEffectBonusValueReduction,
    buildingWheatLimit,
    total,
  };
};
