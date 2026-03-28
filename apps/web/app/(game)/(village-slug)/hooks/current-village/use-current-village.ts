import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { villageSchema } from '@pillage-first/types/models/village';
import { VillageSlugContext } from 'app/(game)/(village-slug)/providers/village-slug-provider.tsx';
import { currentVillageCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useCurrentVillage = () => {
  const { fetcher } = use(ApiContext);
  const { villageSlug } = use(VillageSlugContext);

  const { data: currentVillage } = useSuspenseQuery({
    queryKey: [currentVillageCacheKey, villageSlug],
    queryFn: async () => {
      const { data } = await fetcher(`/villages/${villageSlug}`);

      return villageSchema.parse(data);
    },
    staleTime: 20_000,
  });

  return {
    currentVillage,
  };
};
