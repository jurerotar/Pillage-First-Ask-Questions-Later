import { database } from 'database/database';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import { Effect, GlobalEffect, ServerEffect, VillageEffect } from 'interfaces/models/game/effect';
import { useQuery } from '@tanstack/react-query';
import { Server } from 'interfaces/models/game/server';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { globalEffectGuard, serverEffectGuard, villageEffectGuard } from 'app/[game]/utils/guards/effect-guards';

export const effectsCacheKey = 'effects';

export const getEffects = (serverId: Server['id']) => database.effects.where({ serverId }).toArray();

export const useEffects = () => {
  const { serverId } = useCurrentServer();
  const { currentVillageId } = useCurrentVillage();

  const { data: effects } = useQuery<Effect[]>({
    queryFn: () => getEffects(serverId),
    queryKey: [effectsCacheKey, serverId],
    initialData: [],
  });

  const serverEffects: ServerEffect[] = effects.filter(serverEffectGuard);
  const globalEffects: GlobalEffect[] = effects.filter(globalEffectGuard);
  const villageEffects: VillageEffect[] = effects.filter(villageEffectGuard);
  const currentVillageEffects: VillageEffect[] = villageEffects.filter(({ villageId }) => villageId === currentVillageId);

  return {
    effects,
    globalEffects,
    villageEffects,
    currentVillageEffects,
    serverEffects,
  };
};
