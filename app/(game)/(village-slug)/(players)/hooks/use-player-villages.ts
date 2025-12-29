import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { resourceFieldCompositionSchema } from 'app/interfaces/models/game/resource-field-composition';

const getPlayerVillageSchema = z.strictObject({
  id: z.number(),
  tileId: z.number(),
  coordinates: z.strictObject({
    x: z.number(),
    y: z.number(),
  }),
  name: z.string(),
  slug: z.string(),
  population: z.number(),
  resourceFieldComposition: resourceFieldCompositionSchema,
});

export const usePlayerVillages = (playerId: number) => {
  const { fetcher } = use(ApiContext);
  const { data: playerVillages } = useSuspenseQuery({
    queryKey: ['player-villages', playerId],
    queryFn: async () => {
      const response = await fetcher(
        `/players/${playerId}/villages-with-population`,
      );
      return z.array(getPlayerVillageSchema).parse(response.data);
    },
  });
  return {
    playerVillages,
  };
};
