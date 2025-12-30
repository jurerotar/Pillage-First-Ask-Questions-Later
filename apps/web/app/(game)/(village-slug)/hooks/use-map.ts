import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import { resourceSchema } from '@pillage-first/types/models/resource';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import { baseTileSchema } from '@pillage-first/types/models/tile';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import { ApiContext } from 'app/(game)/providers/api-provider';

const freeTileSchema = baseTileSchema.extend({
  type: z.literal('free'),
  resourceFieldComposition: resourceFieldCompositionSchema,
  isOccupied: z.boolean(),
  tribe: tribeSchema.nullable(),
  population: z.number().nullable(),
  reputation: z.number().nullable(),
  itemId: z.number().nullable(),
});

const oasisTileSchema = baseTileSchema.extend({
  type: z.literal('oasis'),
  oasisGraphics: z.number(),
  oasisResource: resourceSchema.nullable(),
  isOccupied: z.boolean(),
});

export const tilesSchema = z
  .discriminatedUnion('type', [freeTileSchema, oasisTileSchema])
  .nullable();

export const useMap = () => {
  const { fetcher } = use(ApiContext);

  const { data: map } = useSuspenseQuery({
    queryKey: ['tiles'],
    queryFn: async () => {
      const { data } = await fetcher('/tiles');

      return z.array(tilesSchema).parse(data);
    },
  });

  return {
    map,
  };
};
