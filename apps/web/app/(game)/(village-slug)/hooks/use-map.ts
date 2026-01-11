import { useSuspenseQuery } from '@tanstack/react-query';
import { use, useMemo } from 'react';
import { z } from 'zod';
import {
  tileSchema,
  type UnoccupiedOasisTile,
} from '@pillage-first/types/models/tile';
import {
  encodeGraphicsProperty,
  tileIdToCoordinates,
} from '@pillage-first/utils/map';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { useServer } from './use-server';

const useTiles = () => {
  const { fetcher } = use(ApiContext);

  const { data: tiles } = useSuspenseQuery({
    queryKey: ['tiles'],
    queryFn: async () => {
      // TODO: This query is *really* heavy.
      // What we should do is remove all the non-static parts (world items, troop movements,...) so that this query can be permanently cached.
      const { data } = await fetcher('/tiles');

      return z.array(tilesApiSchema).parse(data);
    },
  });

  return {
    tiles,
  };
};

const useBorderTiles = () => {
  const { tiles } = useTiles();
  const { mapSize } = useServer();

  // We only use useQuery here so we can persist this data between page changes
  const { data: borderTiles } = useSuspenseQuery({
    queryKey: ['border-tiles'],
    queryFn: () => {
      const borderTiles: UnoccupiedOasisTile[] = [];

      for (const [index, tile] of tiles.entries()) {
        if (tile !== null) {
          continue;
        }

        const borderTile = {
          id: index + 1,
          coordinates: tileIdToCoordinates(index + 1, mapSize),
          type: 'oasis',
          attributes: {
            oasisGraphics: BORDER_TILES_OASIS_GRAPHICS[index % 4],
            isOccupiable: false,
          },
          owner: null,
          ownerVillage: null,
        } satisfies UnoccupiedOasisTile;

        borderTiles.push(borderTile);
      }

      return borderTiles;
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });

  return {
    borderTiles,
  };
};

// We don't save border tiles to db, so they come back as null;
const tilesApiSchema = tileSchema.nullable();

export const BORDER_TILES_OASIS_VARIANTS = new Set([1, 2, 3, 4]);

const BORDER_TILES_OASIS_GRAPHICS = Array.from([
  ...BORDER_TILES_OASIS_VARIANTS,
]).map((variant) => {
  return encodeGraphicsProperty('wood', 0, 0, 0, variant);
});

export const useMap = () => {
  const { tiles } = useTiles();
  const { borderTiles } = useBorderTiles();

  const map = useMemo(() => {
    const completeTiles: z.infer<typeof tileSchema>[] = Array.from({
      length: tiles.length,
    });

    const borderTileIndex = 0;

    for (const [index, tile] of tiles.entries()) {
      if (tile === null) {
        completeTiles[index] = borderTiles[borderTileIndex];
        continue;
      }

      completeTiles[index] = tile;
    }

    return completeTiles;
  }, [tiles, borderTiles]);

  return {
    map,
  };
};
