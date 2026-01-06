import type { Effect } from '@pillage-first/types/models/effect';
import { useEffects } from 'app/(game)/(village-slug)/hooks/use-effects';

const effectsThatNeedServerValueModificationInDisplay = new Set<Effect['id']>([
  'woodProduction',
  'clayProduction',
  'ironProduction',
  'wheatProduction',
]);

export const useEffectServerValue = (effectId: Effect['id']) => {
  const { effects } = useEffects();

  const serverEffect = effects.find(({ id }) => id === effectId);

  return {
    hasEffect:
      !!serverEffect &&
      effectsThatNeedServerValueModificationInDisplay.has(effectId),
    serverEffectValue: serverEffect?.value ?? 1,
  };
};
