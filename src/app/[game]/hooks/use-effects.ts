import { useQuery } from '@tanstack/react-query';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { isGlobalEffect, isServerEffect, isVillageEffect } from 'app/[game]/utils/guards/effect-guards';
import type { Effect, GlobalEffect, ServerEffect, VillageEffect } from 'interfaces/models/game/effect';
import { getParsedFileContents } from 'app/utils/opfs';

export const effectsCacheKey = 'effects';

export const useEffects = () => {
  const { serverHandle } = useCurrentServer();
  const { currentVillageId } = useCurrentVillage();

  const { data: effects } = useQuery<Effect[]>({
    queryFn: () => getParsedFileContents(serverHandle, 'effects'),
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
