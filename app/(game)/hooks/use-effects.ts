import { useQuery } from '@tanstack/react-query';
import { CurrentVillageContext } from 'app/(game)/providers/current-village-provider';
import { isGlobalEffect, isServerEffect, isVillageEffect } from 'app/(game)/utils/guards/effect-guards';
import type { Effect, GlobalEffect, ServerEffect, VillageEffect } from 'app/interfaces/models/game/effect';
import { effectsCacheKey } from 'app/(game)/constants/query-keys';
import { use } from 'react';

export const useEffects = () => {
  const { currentVillage } = use(CurrentVillageContext);

  const { data: effects } = useQuery<Effect[]>({
    queryKey: [effectsCacheKey],
    initialData: [],
  });

  const serverEffects: ServerEffect[] = effects.filter(isServerEffect);
  const globalEffects: GlobalEffect[] = effects.filter(isGlobalEffect);
  const villageEffects: VillageEffect[] = effects.filter(isVillageEffect);
  const currentVillageEffects: VillageEffect[] = villageEffects.filter(({ villageId }) => villageId === currentVillage.id);

  return {
    effects,
    globalEffects,
    villageEffects,
    currentVillageEffects,
    serverEffects,
  };
};
