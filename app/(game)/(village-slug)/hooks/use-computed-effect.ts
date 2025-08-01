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
  effectId: Exclude<
    EffectId,
    'wheatProduction' | 'woodProduction' | 'clayProduction' | 'ironProduction'
  >,
): ComputedEffectReturn;
export function useComputedEffect(
  effectId:
    | 'wheatProduction'
    | 'woodProduction'
    | 'clayProduction'
    | 'ironProduction',
): WheatProductionEffectReturn;

// The idea behind this hook is to give you a computed effect value based on currentVillage effects & global effects
export function useComputedEffect(
  effectId: EffectId,
): ComputedEffectReturn | WheatProductionEffectReturn {
  const { effects } = useEffects();
  const { currentVillage } = useCurrentVillage();

  const fetcher = () => {
    return calculateComputedEffect(effectId, effects, currentVillage.id);
  };

  const { data: computedEffect } = useQuery({
    queryKey: [effectId, currentVillage.id, effects],
    queryFn: fetcher,
    initialData: fetcher,
    initialDataUpdatedAt: Date.now(),
    queryKeyHashFn: () => {
      const effectHash = effects.map((effect) => effect.value).join('|');
      return `effect-id-[${effectId}]-village-id-[${currentVillage.id}]-updated-at-[${currentVillage.lastUpdatedAt}]-${effectHash}`;
    },
  });

  return computedEffect;
}
