import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import { villageListing } from 'app/(game)/(village-slug)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { coordinatesSchema } from 'app/interfaces/models/common';
import { resourceFieldCompositionSchema } from 'app/interfaces/models/game/resource-field-composition';

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
