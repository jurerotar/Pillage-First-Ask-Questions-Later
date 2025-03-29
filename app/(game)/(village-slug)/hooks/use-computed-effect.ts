import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useEffects } from 'app/(game)/(village-slug)/hooks/use-effects';
import type { Effect, EffectId, VillageEffect } from 'app/interfaces/models/game/effect';
import type { Village } from 'app/interfaces/models/game/village';
import { useQuery } from '@tanstack/react-query';
import { nonPersistedCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

const normalizeForcedFloatValue = (value: number) => {
  if (`${value}`.endsWith('.001')) {
    return Math.trunc(value);
  }

  return value;
};

type ComputedEffectReturn = {
  effectBaseValue: number;
  effectBonusValue: number;
  serverEffectValue: number;
  total: number;
};

type WheatProductionEffectReturn = ComputedEffectReturn & {
  buildingWheatConsumption: number;
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

  const total =
    baseWheatProduction * wheatProductionBonus + buildingWheatConsumption - troopWheatConsumption * troopWheatConsumptionReductionBonus;

  return {
    serverEffectValue,
    effectBaseValue: baseWheatProduction,
    effectBonusValue: wheatProductionBonus,
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

export function useComputedEffect(effectId: Exclude<EffectId, 'wheatProduction'>): ComputedEffectReturn;
export function useComputedEffect(effectId: 'wheatProduction'): WheatProductionEffectReturn;

// The idea behind this hook is to give you a computed effect value based on currentVillage effects & global effects
export function useComputedEffect(effectId: EffectId): ComputedEffectReturn | WheatProductionEffectReturn {
  const { effects } = useEffects();
  const { currentVillage } = useCurrentVillage();

  const fetcher = () => {
    // This is stupid, but we need to have it like this for the overload to work correctly
    if (effectId === 'wheatProduction') {
      return calculateComputedEffect(effectId, effects, currentVillage.id);
    }
    return calculateComputedEffect(effectId, effects, currentVillage.id);
  };

  const { data: computedEffect } = useQuery({
    queryKey: [nonPersistedCacheKey, effectId, currentVillage.id, effects],
    queryFn: fetcher,
    initialData: fetcher,
    initialDataUpdatedAt: Date.now(),
    gcTime: 10_000,
    queryKeyHashFn: () => {
      const effectHash = effects.map((effect) => `${effect.id}:${effect.value}`).join('|');
      return `${nonPersistedCacheKey}-effect-id-[${effectId}]-village-id-[${currentVillage.id}]-${effectHash}`;
    },
  });

  return computedEffect;
}
