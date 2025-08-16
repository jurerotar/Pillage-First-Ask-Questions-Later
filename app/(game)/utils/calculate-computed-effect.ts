import type {
  Effect,
  VillageBuildingEffect,
  VillageEffect,
} from 'app/interfaces/models/game/effect';
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

    switch (effect.source) {
      case 'tribe': {
        // Egyptian hero has double resource production
        assignEffectValue(effect, heroEffectValues);
        break;
      }
      case 'building': {
        const buildingEffect = effect as VillageBuildingEffect;

        // "Waterworks" is special, because it applies an oasis effect instead of a building one
        if (buildingEffect.buildingId === 'WATERWORKS') {
          assignEffectValue(buildingEffect, oasisEffectValues);
          break;
        }
        assignEffectValue(effect, buildingEffectValues);
        break;
      }
      case 'hero': {
        assignEffectValue(effect, heroEffectValues);
        break;
      }
      case 'artifact': {
        assignEffectValue(effect, artifactEffectValues);
        break;
      }
      case 'oasis': {
        assignEffectValue(effect, oasisEffectValues);
        break;
      }
      case 'troops': {
        assignEffectValue(effect, troopEffectValues);
        break;
      }
    }
  }

  const combinedDelta =
    (buildingEffectValues.bonus - 1) * buildingEffectValues.bonusBooster +
    (oasisEffectValues.bonus - 1) * oasisEffectValues.bonusBooster +
    (artifactEffectValues.bonus - 1) * artifactEffectValues.bonusBooster +
    (heroEffectValues.bonus - 1) * heroEffectValues.bonusBooster +
    (troopEffectValues.bonus - 1) * troopEffectValues.bonusBooster;

  const combinedBonusEffectValue = 1 + combinedDelta;

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

  const serverEffectValue = effectBreakdown.serverEffectValue;
  const buildingEffectValues = effectBreakdown.buildingEffectValues;
  const heroEffectValues = effectBreakdown.heroEffectValues;
  const artifactEffectValues = effectBreakdown.artifactEffectValues;
  const oasisEffectValues = effectBreakdown.oasisEffectValues;

  // Some effects act only as modifiers to hardcoded values.
  // Examples of these effects are things like building duration and training duration.
  // In these cases, we need only to return the modifier value to apply to our base.
  const isBaseBuildingValueABaseValue = buildingEffectValues.base.length > 0;

  if (!isBaseBuildingValueABaseValue) {
    return {
      total: effectBreakdown.combinedBonusEffectValue * serverEffectValue,
    };
  }

  let summedHeroEffectBaseValue = 0;

  for (const value of heroEffectValues.base) {
    summedHeroEffectBaseValue += value * serverEffectValue;
  }

  let summedArtifactEffectBaseValue = 0;

  for (const value of artifactEffectValues.base) {
    summedArtifactEffectBaseValue += value * serverEffectValue;
  }

  let summedOasisEffectBaseValue = 0;

  for (const value of oasisEffectValues.base) {
    summedOasisEffectBaseValue += value * serverEffectValue;
  }

  let summedTroopEffectBaseValue = 0;

  for (const value of effectBreakdown.troopEffectValues.base) {
    summedTroopEffectBaseValue += value * serverEffectValue;
  }

  let summedBuildingEffectBasePositiveValue = 0;
  let summedBuildingEffectBaseNegativeValue = 0;

  for (const value of buildingEffectValues.base) {
    if (value < 0) {
      summedBuildingEffectBaseNegativeValue += value;
      continue;
    }

    const baseValue = value * serverEffectValue;
    const buildingBonus =
      buildingEffectValues.bonus > 1
        ? Math.trunc(
            baseValue *
              (buildingEffectValues.bonus - 1) *
              buildingEffectValues.bonusBooster,
          )
        : 0;
    const heroBonus =
      heroEffectValues.bonus > 1
        ? Math.trunc(
            baseValue *
              (heroEffectValues.bonus - 1) *
              heroEffectValues.bonusBooster,
          )
        : 0;
    const artifactBonus =
      artifactEffectValues.bonus > 1
        ? Math.trunc(
            baseValue *
              (artifactEffectValues.bonus - 1) *
              artifactEffectValues.bonusBooster,
          )
        : 0;
    const oasisBonus =
      oasisEffectValues.bonus > 1
        ? Math.trunc(
            baseValue *
              (oasisEffectValues.bonus - 1) *
              oasisEffectValues.bonusBooster,
          )
        : 0;

    summedBuildingEffectBasePositiveValue +=
      baseValue + buildingBonus + heroBonus + artifactBonus + oasisBonus;
  }

  if (effectId === 'wheatProduction') {
    const unitWheatConsumptionBreakdown = getEffectBreakdown(
      'unitWheatConsumption',
      effects,
      currentVillageId,
    );

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

  const total =
    summedBuildingEffectBasePositiveValue +
    summedArtifactEffectBaseValue +
    summedOasisEffectBaseValue +
    summedTroopEffectBaseValue +
    summedHeroEffectBaseValue;

  return {
    total,
  };
}
