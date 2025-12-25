import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { effectsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { ApiContext } from 'app/(game)/providers/api-provider';
import type { Effect } from 'app/interfaces/models/game/effect';

export const useEffects = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: effects } = useSuspenseQuery<Effect[]>({
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
