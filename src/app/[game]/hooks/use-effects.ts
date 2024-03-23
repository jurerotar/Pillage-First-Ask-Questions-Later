import { database } from 'database/database';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import { Effect, EffectType, GlobalEffect, VillageEffect } from 'interfaces/models/game/effect';
import { useQuery } from '@tanstack/react-query';
import { Server } from 'interfaces/models/game/server';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';

export const effectsCacheKey = 'effects';

export const getEffects = (serverId: Server['id']) => database.effects.where({ serverId }).toArray();

const globalEffectGuard = (effect: Effect): effect is Effect<EffectType.GLOBAL> => {
  return effect.scope === 'global';
};

const villageEffectGuard = (effect: Effect): effect is Effect<EffectType.VILLAGE> => {
  return effect.scope === 'village';
};

const villageBuildingEffectGuard = (effect: Effect): effect is Effect<EffectType.VILLAGE_BUILDING> => {
  return effect.scope === 'village' && Object.hasOwn(effect, 'buildingFieldId');
};

const villageOasisBonusEffectGuard = (effect: Effect): effect is Effect<EffectType.VILLAGE_OASIS> => {
  return effect.scope === 'village' && Object.hasOwn(effect, 'tileId');
};

export const useEffects = () => {
  const { serverId } = useCurrentServer();
  const { currentVillageId } = useCurrentVillage();

  const { data: effects } = useQuery<Effect[]>({
    queryFn: () => getEffects(serverId),
    queryKey: [effectsCacheKey, serverId],
    initialData: [],
  });

  const globalEffects: GlobalEffect[] = effects.filter(globalEffectGuard);
  const villageEffects: VillageEffect[] = effects.filter(villageEffectGuard);

  const currentVillageEffects: VillageEffect[] = villageEffects.filter(({ villageId }) => villageId === currentVillageId);

  return {
    effects,
    globalEffects,
    currentVillageEffects,
  };
};
