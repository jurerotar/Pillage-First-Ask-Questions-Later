import { useSuspenseQuery } from '@tanstack/react-query';
import type { Effect } from 'app/interfaces/models/game/effect';
import { effectsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';

export const useEffects = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: effects } = useSuspenseQuery({
    queryKey: [effectsCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await fetcher<Effect[]>(
        `/villages/${currentVillage.id}/effects`,
      );
      return data;
    },
  });

  return {
    effects,
  };
};
