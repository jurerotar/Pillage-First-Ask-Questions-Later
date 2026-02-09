import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import { coordinatesSchema } from '@pillage-first/types/models/coordinates';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import { villageListing } from 'app/(game)/(village-slug)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

const getPlayerVillageListingSchema = z.strictObject({
  id: z.number(),
  tileId: z.number(),
  coordinates: coordinatesSchema,
  name: z.string(),
  slug: z.string(),
  resourceFieldComposition: resourceFieldCompositionSchema,
});

export const usePlayerVillageListing = () => {
  const { fetcher } = use(ApiContext);

  const { data: playerVillages } = useSuspenseQuery({
    queryKey: [villageListing],
    queryFn: async () => {
      const { data } = await fetcher('/me/villages');

      return z.array(getPlayerVillageListingSchema).parse(data);
    },
  });

  return {
    playerVillages,
  };
};
