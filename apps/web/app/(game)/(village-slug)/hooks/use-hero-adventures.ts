import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import {
  adventurePointsCacheKey,
  heroCacheKey,
  troopMovementsCacheKey,
  villageTroopsCacheKey,
} from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { invalidateQueries } from 'app/utils/react-query';
import { useMe } from './use-me';

export const useHeroAdventures = () => {
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();
  const { player } = useMe();

  const {
    data: { available, completed },
  } = useSuspenseQuery({
    queryKey: [adventurePointsCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get(
        '/players/:playerId/hero/adventures',
        {
          path: {
            playerId: player.id,
          },
        },
      );

      return data;
    },
  });

  const { mutate: startAdventure } = useMutation({
    mutationFn: async () => {
      await apiClient.post('/players/:playerId/hero/adventures', {
        path: {
          playerId: player.id,
        },
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [heroCacheKey],
        [villageTroopsCacheKey, currentVillage.id],
        [troopMovementsCacheKey, currentVillage.id],
      ]);
    },
  });

  return {
    available,
    completed,
    startAdventure,
  };
};
