import { useQuery } from '@tanstack/react-query';
import { useCurrentVillage } from 'app/(game)/hooks/use-current-village';
import { isGlobalEffect, isServerEffect, isVillageEffect } from 'app/(game)/utils/guards/effect-guards';
import type { Effect, GlobalEffect, ServerEffect, VillageEffect } from 'app/interfaces/models/game/effect';
import { effectsCacheKey } from 'app/query-keys';

export const useEffects = () => {
  const { currentVillageId } = useCurrentVillage();

  const { data: effects } = useQuery<Effect[]>({
    queryKey: [effectsCacheKey],
    initialData: [],
  });

  const serverEffects: ServerEffect[] = effects.filter(isServerEffect);
  const globalEffects: GlobalEffect[] = effects.filter(isGlobalEffect);
  const villageEffects: VillageEffect[] = effects.filter(isVillageEffect);
  const currentVillageEffects: VillageEffect[] = villageEffects.filter(({ villageId }) => villageId === currentVillageId);

  return {
    effects,
    globalEffects,
    villageEffects,
    currentVillageEffects,
    serverEffects,
  };
};
