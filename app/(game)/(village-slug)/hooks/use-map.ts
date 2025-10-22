import { useSuspenseQuery } from '@tanstack/react-query';
import { baseTileSchema } from 'app/interfaces/models/game/tile';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { eventsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
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
  itemType: z.string().nullable(),
});

const oasisTileSchema = baseTileSchema.extend({
  type: z.literal('oasis'),
  oasisGraphics: z.number(),
  oasisResource: resourceSchema.nullable(),
  isOccupied: z.boolean(),
});

export const tilesSchema = z.discriminatedUnion('type', [
  freeTileSchema,
  oasisTileSchema,
]);

export const useMap = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: contextualMap } = useSuspenseQuery({
    queryKey: ['contextual-map', eventsCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await fetcher(`/map/${currentVillage.id}/contextual`);

      return z.array(tilesSchema).parse(data);
    },
  });

  return {
    contextualMap,
  };
};
