import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useEffects } from 'app/(game)/(village-slug)/hooks/use-effects';
import type { EffectId } from 'app/interfaces/models/game/effect';
import { useQuery } from '@tanstack/react-query';
import {
  calculateComputedEffect,
  type ComputedEffectReturn,
  type WheatProductionEffectReturn,
} from 'app/(game)/utils/calculate-computed-effect';

export function useComputedEffect(
  effectId: Exclude<EffectId, 'wheatProduction'>,
): ComputedEffectReturn;
export function useComputedEffect(
  effectId: 'wheatProduction',
): WheatProductionEffectReturn;

// The idea behind this hook is to give you a computed effect value based on currentVillage effects & global effects
export function useComputedEffect(
  effectId: EffectId,
): ComputedEffectReturn | WheatProductionEffectReturn {
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
    queryKey: [effectId, currentVillage.id, effects],
    queryFn: fetcher,
    initialData: fetcher,
    initialDataUpdatedAt: Date.now(),
    gcTime: 10_000,
    queryKeyHashFn: () => {
      const effectHash = effects.map((effect) => effect.value).join('|');
      return `effect-id-[${effectId}]-village-id-[${currentVillage.id}]-updated-at-[${currentVillage.lastUpdatedAt}]-${effectHash}`;
    },
  });

  return computedEffect;
}
