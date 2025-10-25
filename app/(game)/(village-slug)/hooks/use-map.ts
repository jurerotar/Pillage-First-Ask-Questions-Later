import { useSuspenseQuery } from '@tanstack/react-query';
import { baseTileSchema } from 'app/interfaces/models/game/tile';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { z } from 'zod';
import { resourceFieldCompositionSchema } from 'app/interfaces/models/game/resource-field-composition';
import { tribeSchema } from 'app/interfaces/models/game/tribe';
import { resourceSchema } from 'app/interfaces/models/game/resource';

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
