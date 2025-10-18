import { useSuspenseQuery } from '@tanstack/react-query';
import { artifactsInVicinityCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { z } from 'zod';

const _getArtifactsAroundCurrentVillageSchema = z.strictObject({
  id: z.number(),
  coordinates: z.strictObject({
    x: z.number(),
    y: z.number(),
  }),
  distance: z.number(),
});

export const useArtifactsAroundCurrentVillage = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: artifactsAroundCurrentVillage } = useSuspenseQuery<
    z.infer<typeof _getArtifactsAroundCurrentVillageSchema>[]
  >({
    queryKey: [artifactsInVicinityCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await fetcher<
        z.infer<typeof _getArtifactsAroundCurrentVillageSchema>[]
      >(`/villages/${currentVillage.id}/artifacts`);
      return data;
    },
  });

  return {
    artifactsAroundCurrentVillage,
  };
};
