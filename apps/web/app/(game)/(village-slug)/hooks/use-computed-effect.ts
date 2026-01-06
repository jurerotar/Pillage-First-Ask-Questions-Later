import { useQuery } from '@tanstack/react-query';
import type { EffectId } from '@pillage-first/types/models/effect';
import {
  type ComputedEffectReturn,
  calculateComputedEffect,
  type WheatProductionEffectReturn,
} from '@pillage-first/utils/game/calculate-computed-effect';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useEffects } from 'app/(game)/(village-slug)/hooks/use-effects';

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
