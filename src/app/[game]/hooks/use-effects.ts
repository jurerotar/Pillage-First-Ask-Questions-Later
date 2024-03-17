import { database } from 'database/database';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import { Effect } from 'interfaces/models/game/effect';
import { useQuery } from '@tanstack/react-query';
import { Server } from 'interfaces/models/game/server';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';

export const effectsCacheKey = 'effects';

export const getEffects = (serverId: Server['id']) => database.effects.where({ serverId }).toArray();

export const useEffects = () => {
  const { serverId } = useCurrentServer();
  const { currentVillageId } = useCurrentVillage();

  const {
    data: effects,
    isLoading: isLoadingEffects,
    isSuccess: hasLoadedEffects,
    status: effectsQueryStatus,
  } = useQuery<Effect[]>({
    queryFn: () => getEffects(serverId),
    queryKey: [effectsCacheKey, serverId],
    initialData: [],
  });

  const globalEffects = effects.filter(({ scope }) => scope === 'global');
  const currentVillageEffects = effects.filter((effect) => effect.scope === 'village' && effect.villageId === currentVillageId);

  return {
    effects,
    isLoadingEffects,
    hasLoadedEffects,
    effectsQueryStatus,
    globalEffects,
    currentVillageEffects,
  };
};
