import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { heroAdventuresSchema } from '@pillage-first/types/models/hero-adventures';
import {
  adventurePointsCacheKey,
  eventsCacheKey,
  heroCacheKey,
  villageTroopsCacheKey,
} from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { invalidateQueries } from 'app/utils/react-query';

export const useHeroAdventures = () => {
  const { fetcher } = use(ApiContext);

  const {
    data: { available, completed },
  } = useSuspenseQuery({
    queryKey: [adventurePointsCacheKey],
    queryFn: async () => {
      const { data } = await fetcher('/me/hero/adventures');

      return heroAdventuresSchema.parse(data);
    },
  });

  const { mutate: startAdventure } = useMutation({
    mutationFn: async () => {
      await fetcher('/me/hero/adventures', {
        method: 'POST',
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [heroCacheKey],
        [adventurePointsCacheKey],
        [eventsCacheKey],
        [villageTroopsCacheKey],
      ]);
    },
  });

  return {
    available,
    completed,
    startAdventure,
  };
};
