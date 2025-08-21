import type { Effect } from 'app/interfaces/models/game/effect';
import { useEffects } from 'app/(game)/(village-slug)/hooks/use-effects';

const effectsThatNeedServerValueModificationInDisplay: Effect['id'][] = [
  'woodProduction',
  'clayProduction',
  'ironProduction',
  'wheatProduction',
];

export const useEffectServerValue = (effectId: Effect['id']) => {
  const { effects } = useEffects();

  const serverEffect = effects.find(({ id }) => id === effectId);

  return {
    hasEffect:
      !!serverEffect &&
      effectsThatNeedServerValueModificationInDisplay.includes(effectId),
    serverEffectValue: serverEffect?.value ?? 1,
  };
};
