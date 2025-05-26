import type { Effect, VillageEffect } from 'app/interfaces/models/game/effect';
import type { Village } from 'app/interfaces/models/game/village';
import { normalizeForcedFloatValue } from 'app/utils/common';

export type ComputedEffectReturn = {
  effectBaseValue: number;
  effectBonusValue: number;
  serverEffectValue: number;
  total: number;
};

export type WheatProductionEffectReturn = ComputedEffectReturn & {
  buildingWheatConsumption: number;
  buildingWheatLimit: number;
  troopWheatConsumption: number;
  troopWheatConsumptionReductionBonus: number;
};

const calculateWheatProductionEffect = (
  effectId: 'wheatProduction',
  effects: Effect[],
  currentVillageId: Village['id'],
): WheatProductionEffectReturn => {
  const serverEffect = effects.find((effect) => effect.scope === 'server' && effect.id === effectId);
  const serverEffectValue = normalizeForcedFloatValue(serverEffect?.value ?? 1);

  let baseWheatProduction = 0;
  let wheatProductionBonus = 1;

  let buildingWheatConsumption = 0;
  let troopWheatConsumption = 0;

  let troopWheatConsumptionReductionBonus = 1;

  for (const effect of effects) {
    // Skip all server effects because we already have a value and skip all non-wheatProduction effects because we're only checking for this one
    const { source, value, scope, id } = effect;
    if (id !== 'wheatProduction' || effect.scope === 'server') {
      continue;
    }

    const shouldEffectApplyToCurrentVillage = scope === 'global' || (effect as VillageEffect).villageId === currentVillageId;

    if (!shouldEffectApplyToCurrentVillage) {
      continue;
    }

    // Only troops contribute to troopWheatConsumption
    if (source === 'troops') {
      troopWheatConsumption += value;
      continue;
    }

    if (Number.isInteger(value)) {
      const isPositive = value > 0;

      if (isPositive) {
        baseWheatProduction += value;
        continue;
      }

      buildingWheatConsumption += value;
      continue;
    }

    const isGreaterThanOne = value > 1;
    if (isGreaterThanOne) {
      wheatProductionBonus *= normalizeForcedFloatValue(value);
      continue;
    }

    troopWheatConsumptionReductionBonus *= normalizeForcedFloatValue(value);
  }

  const buildingWheatLimit = Math.trunc(baseWheatProduction * wheatProductionBonus) + buildingWheatConsumption;

  const total = buildingWheatLimit - Math.trunc(troopWheatConsumption * troopWheatConsumptionReductionBonus);

  return {
    serverEffectValue,
    effectBaseValue: baseWheatProduction,
    effectBonusValue: wheatProductionBonus,
    buildingWheatLimit,
    buildingWheatConsumption,
    troopWheatConsumption,
    troopWheatConsumptionReductionBonus,
    total,
  };
};

export const calculateComputedEffect = (
  effectId: Effect['id'],
  effects: Effect[],
  currentVillageId: Village['id'],
): ComputedEffectReturn => {
  if (effectId === 'wheatProduction') {
    return calculateWheatProductionEffect('wheatProduction', effects, currentVillageId);
  }

  // There is at most 1 server effect for specific effect type, so we find it here and can skip iterations with server scope effects later
  const serverEffect = effects.find((effect) => effect.scope === 'server' && effect.id === effectId);
  const serverEffectValue = normalizeForcedFloatValue(serverEffect?.value ?? 1);

  let effectBaseValue = 0;
  let effectBonusValue = 1;

  for (const effect of effects) {
    const { value, scope } = effect;

    if (scope === 'server' || effectId !== effect.id) {
      continue;
    }

    const shouldEffectApplyToCurrentVillage = scope === 'global' || (effect as VillageEffect).villageId === currentVillageId;

    if (!shouldEffectApplyToCurrentVillage) {
      continue;
    }

    if (Number.isInteger(value)) {
      effectBaseValue += value;
      continue;
    }

    effectBonusValue *= normalizeForcedFloatValue(value);
  }

  const total = (effectBaseValue === 0 ? 1 : effectBaseValue) * effectBonusValue * serverEffectValue;

  return {
    serverEffectValue,
    effectBaseValue,
    effectBonusValue,
    total,
  };
};
