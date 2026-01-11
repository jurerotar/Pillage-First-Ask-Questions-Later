import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import { tileSchema } from '@pillage-first/types/models/tile';
import {
  encodeGraphicsProperty,
  tileIdToCoordinates,
} from '@pillage-first/utils/map';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { useServer } from './use-server';

// We don't save border tiles to db, so they come back as null;
const tilesApiSchema = z.array(tileSchema.nullable());
const mapSchema = z.array(tileSchema);

export const BORDER_TILES_OASIS_VARIANTS = [1, 2, 3, 4];
const BORDER_TILES_OASIS_GRAPHICS = BORDER_TILES_OASIS_VARIANTS.map((variant) =>
  encodeGraphicsProperty('wood', 0, 0, 0, variant),
);

export const useMap = () => {
  const { fetcher } = use(ApiContext);
  const { mapSize } = useServer();

  const { data: map } = useSuspenseQuery({
    queryKey: ['tiles'],
    queryFn: async () => {
      // TODO: This query is *really* heavy.
      // What we should do is remove all the non-static parts (world items, troop movements,...) so that this query can be permanently cached.
      const { data } = await fetcher('/tiles');

      return tilesApiSchema.parse(data);
    },
    select: (data) => {
      const mappedBorderTilesToOasisTiles = data.map(
        (item, idx) =>
          item || {
            type: 'oasis',
            id: idx + 1,
            coordinates: tileIdToCoordinates(idx + 1, mapSize),
            owner: null,
            ownerVillage: null,
            attributes: {
              oasisGraphics: BORDER_TILES_OASIS_GRAPHICS[idx % 4],
              isOccupiable: false,
            },
          },
      );
      return mapSchema.parse(mappedBorderTilesToOasisTiles);
    },
  });

  return {
    map,
  };
};
