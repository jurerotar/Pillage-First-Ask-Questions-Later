import type { ApiHandler } from 'app/interfaces/api';
import { effectsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { Effect } from 'app/interfaces/models/game/effect';
import {
  isGlobalEffect,
  isServerEffect,
  isVillageEffect,
} from 'app/(game)/guards/effect-guards';

export const getVillageEffects: ApiHandler<Effect[], 'villageId'> = async (
  queryClient,
  { params },
) => {
  const { villageId } = params;

  const effects = queryClient.getQueryData<Effect[]>([effectsCacheKey])!;

  return effects.filter((effect) => {
    if (isGlobalEffect(effect) || isServerEffect(effect)) {
      return true;
    }

    if (isVillageEffect(effect)) {
      return effect.villageId === villageId;
    }

    return false;
  });
};
