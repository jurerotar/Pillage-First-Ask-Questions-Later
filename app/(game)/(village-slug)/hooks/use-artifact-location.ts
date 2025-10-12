import { useSuspenseQuery } from '@tanstack/react-query';
import { artifactLocationCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { z } from 'zod';

const _getArtifactLocationsSchema = z.strictObject({
  id: z.number(),
  coordinates: z.strictObject({
    x: z.number(),
    y: z.number(),
  }),
  distance: z.number(),
});

export const useArtifactLocation = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: artifacts } = useSuspenseQuery<
    z.infer<typeof _getArtifactLocationsSchema>[]
  >({
    queryKey: [artifactLocationCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await fetcher<
        z.infer<typeof _getArtifactLocationsSchema>[]
      >(`/villages/${currentVillage.id}/artifacts`);
      return data;
    },
  });

  return {
    artifacts,
  };
};
