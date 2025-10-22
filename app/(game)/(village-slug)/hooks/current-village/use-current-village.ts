import { useRouteSegments } from 'app/(game)/(village-slug)/hooks/routes/use-route-segments';
import { useSuspenseQuery } from '@tanstack/react-query';
import { villageSchema } from 'app/interfaces/models/game/village';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { playerVillagesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

export const useCurrentVillage = () => {
  const { fetcher } = use(ApiContext);
  const { villageSlug } = useRouteSegments();

  const { data: currentVillage } = useSuspenseQuery({
    queryKey: [playerVillagesCacheKey, villageSlug],
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
