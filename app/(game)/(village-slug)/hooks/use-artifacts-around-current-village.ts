import { useSuspenseQuery } from '@tanstack/react-query';
import { artifactsInVicinityCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { z } from 'zod';
import { coordinatesSchema } from 'app/interfaces/models/common';

const getArtifactsAroundCurrentVillageSchema = z.strictObject({
  id: z.number(),
  coordinates: coordinatesSchema,
  distance: z.number(),
});

export const useArtifactsAroundCurrentVillage = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: artifactsAroundCurrentVillage } = useSuspenseQuery({
    queryKey: [artifactsInVicinityCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await fetcher(
        `/villages/${currentVillage.id}/artifacts`,
      );

      return z.array(getArtifactsAroundCurrentVillageSchema).parse(data);
    },
  });

  return {
    artifactsAroundCurrentVillage,
  };
};
