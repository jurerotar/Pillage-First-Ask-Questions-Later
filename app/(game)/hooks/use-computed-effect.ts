import { useCurrentVillage } from 'app/(game)/hooks/current-village/use-current-village';
import { useEffects } from 'app/(game)/hooks/use-effects';
import { isGlobalEffect, isVillageEffect } from 'app/(game)/utils/guards/effect-guards';
import type { Effect, EffectId, GlobalEffect, VillageEffect } from 'app/interfaces/models/game/effect';
import type { Village } from 'app/interfaces/models/game/village';
import { useQuery } from '@tanstack/react-query';
import { nonPersistedCacheKey } from 'app/(game)/constants/query-keys';

const normalize1001Value = (value: number) => {
  if (value === 1.001) {
    return 1;
  }

  return value;
};

export const calculateComputedEffect = (effectId: Effect['id'], effects: Effect[], currentVillageId: Village['id']) => {
  const bonusEffectId = `${effectId}Bonus`;

  const bonusEffectIdFilterFunction = ({ id }: Effect) => id === bonusEffectId;
  const effectIdFilterFunction = ({ id }: Effect) => id === effectId;

  const globalEffects: GlobalEffect[] = effects.filter(isGlobalEffect);
  const villageEffects: VillageEffect[] = effects.filter(isVillageEffect);
  const currentVillageEffects: VillageEffect[] = villageEffects.filter(({ villageId }) => villageId === currentVillageId);

  const baseEffects = [...currentVillageEffects.filter(effectIdFilterFunction), ...globalEffects.filter(effectIdFilterFunction)];
  const bonusEffects = [...currentVillageEffects.filter(bonusEffectIdFilterFunction), ...globalEffects.filter(bonusEffectIdFilterFunction)];

  const cumulativeBaseEffectValue = baseEffects.reduce((acc: number, effect: Effect) => acc + normalize1001Value(effect.value), 0);

  const cumulativeBonusEffectValue = bonusEffects.reduce((acc: number, effect: Effect) => acc + (normalize1001Value(effect.value) - 1), 1);

  // There's always only 1 server effect for particular effect id, but if it's missing, value is 1
  const serverEffectValue = normalize1001Value(effects.find(({ id, scope }) => scope === 'server' && id === effectId)?.value ?? 1);

  const total = cumulativeBaseEffectValue * serverEffectValue * cumulativeBonusEffectValue;

  return {
    cumulativeBaseEffectValue,
    serverEffectValue,
    cumulativeBonusEffectValue,
    total,
  };
};

// The idea behind this hook is to give you a computed effect value based on currentVillage effects & global effects
export const useComputedEffect = (effectId: EffectId) => {
  const { effects } = useEffects();
  const { currentVillage } = useCurrentVillage();

  const fetcher = () => calculateComputedEffect(effectId, effects, currentVillage.id);

  const { data: computedEffect } = useQuery({
    queryKey: [nonPersistedCacheKey, effectId, currentVillage.id, effects],
    queryFn: fetcher,
    initialData: fetcher,
    initialDataUpdatedAt: Date.now(),
    queryKeyHashFn: () => {
      const effectHash = effects.map((effect) => `${effect.id}:${effect.value}`).join('|');
      return `${nonPersistedCacheKey}-${effectId}-${currentVillage.id}-${effectHash}`;
    },
  });

  return computedEffect;
};
