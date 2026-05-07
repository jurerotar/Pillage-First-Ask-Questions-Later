import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import { coordinatesSchema } from '@pillage-first/types/models/coordinates';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import { villageListingCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { useMe } from './use-me';

const getPlayerVillageListingSchema = z.strictObject({
  id: z.number(),
  tileId: z.number(),
  coordinates: coordinatesSchema,
  name: z.string(),
  slug: z.string(),
  resourceFieldComposition: resourceFieldCompositionSchema,
});

export const usePlayerVillageListing = () => {
  const { apiClient } = use(ApiContext);
  const { player } = useMe();

  const { data: playerVillages } = useSuspenseQuery({
    queryKey: [villageListingCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get('/players/:playerId/villages', {
        path: {
          playerId: player.id,
        },
      });

      return z.array(getPlayerVillageListingSchema).parse(data);
    },
  });

  return {
    playerVillages,
  };
};
