import type { ApiHandler } from 'app/interfaces/api';
import { effectsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { Effect } from 'app/interfaces/models/game/effect';
import { isGlobalEffect, isVillageEffect } from 'app/(game)/(village-slug)/hooks/guards/effect-guards';

export const getVillageEffects: ApiHandler<Effect[], 'villageId'> = async (queryClient, { params }) => {
  const { villageId: villageIdParam } = params;
  const villageId = Number.parseInt(villageIdParam);

  const effects = queryClient.getQueryData<Effect[]>([effectsCacheKey])!;

  return effects.filter((effect) => {
    if (isGlobalEffect(effect)) {
      return true;
    }

    if (isVillageEffect(effect)) {
      return effect.villageId === villageId;
    }

    return false;
  });
};
