import { Effect, EffectId, GlobalEffect, ServerEffect, VillageEffect } from 'interfaces/models/game/effect';
import { useEffects } from 'app/[game]/hooks/use-effects';
import { isGlobalEffect, isServerEffect, isVillageEffect } from 'app/[game]/utils/guards/effect-guards';
import { Village } from 'interfaces/models/game/village';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';

export const calculateComputedEffect = (effectId: EffectId, effects: Effect[], currentVillageId: Village['id']) => {
  const serverEffects: ServerEffect[] = effects.filter(isServerEffect);
  const globalEffects: GlobalEffect[] = effects.filter(isGlobalEffect);
  const villageEffects: VillageEffect[] = effects.filter(isVillageEffect);
  const currentVillageEffects: VillageEffect[] = villageEffects.filter(({ villageId }) => villageId === currentVillageId);

  const baseEffects = [...currentVillageEffects.filter(({ id }) => id === effectId), ...globalEffects.filter(({ id }) => id === effectId)];
  const bonusEffects = [
    ...currentVillageEffects.filter(({ id }) => id === `${effectId}Bonus`),
    ...globalEffects.filter(({ id }) => id === `${effectId}Bonus`),
  ];

  const cumulativeBaseEffectValue = baseEffects.reduce((acc: number, effect: Effect) => acc + effect.value, 0);

  const cumulativeBonusEffectValue = bonusEffects.reduce((acc: number, effect: Effect) => {
    if (effect.value > 1) {
      return acc + (effect.value - 1);
    }

    if (effect.value < 1) {
      return acc - (1 - effect.value);
    }

    return acc;
  }, 1);

  // There's always only 1 server effect for particular effect id, but if it's missing, value is 1
  const serverEffectValue = serverEffects.find(({ id }) => id === effectId)?.value ?? 1;

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
  const { currentVillageId } = useCurrentVillage();

  return calculateComputedEffect(effectId, effects, currentVillageId);
};
