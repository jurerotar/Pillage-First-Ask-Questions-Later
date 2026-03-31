import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { loyaltyCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

const useLoyaltySchema = z.strictObject({
  loyalty: z.number().min(0).max(100),
});

export const useLoyalty = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: loyalty } = useSuspenseQuery({
    queryKey: [loyaltyCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await fetcher(`/tiles/${currentVillage.id}/loyalty`);

      return useLoyaltySchema.parse(data);
    },
  });

  return loyalty;
};
