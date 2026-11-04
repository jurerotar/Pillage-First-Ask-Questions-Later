import { z } from 'zod';
import {
  mapMarkerDtoSchema,
  mapTileDtoSchema,
  mapTileOasisBonusDtoSchema,
  mapTileTroopDtoSchema,
} from '@pillage-first/types/dtos/map';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import { calculateGridLayout } from '@pillage-first/utils/map';
import {
  deleteMapMarkerQuery,
  insertMapMarkerQuery,
  selectMapTilesQuery,
  selectPlayerMapMarkersQuery,
  selectTileOasisBonusesQuery,
  selectTileTroopsQuery,
} from '../../queries/map-queries';
import { selectServerMapSizeQuery } from '../../queries/server-queries';
import { createController } from '../controller';
import {
  mapMarker,
  mapTile,
  mapTileOasisBonus,
  mapTileTroop,
} from './mappers/map-mapper';
import {
  getMapMarkersSchema,
  getTileOasisBonusesSchema,
  getTilesJsonSchema,
  type getTilesSchema,
  getTileTroopsSchema,
} from './schemas/map-schemas';

export const getMapMarkers = createController('/me/map-markers', {
  summary: 'Get map markers',
  response: z.array(mapMarkerDtoSchema),
})(({ database, context: { playerId } }) => {
  const rows = database.selectObjects({
    sql: selectPlayerMapMarkersQuery,
    bind: {
      $player_id: playerId,
    },
    schema: getMapMarkersSchema,
  });

  return rows.map(mapMarker);
});

export const addMapMarker = createController('/me/map-markers', 'post', {
  summary: 'Add map marker',
  requestBody: z.strictObject({
    tileId: tileIdSchema,
    description: z.string(),
    color: mapMarkerDtoSchema.shape.color,
    icon: mapMarkerDtoSchema.shape.icon,
  }),
})(
  ({
    database,
    context: { playerId },
    body: { tileId, description, color, icon },
  }) => {
    database.transaction((db) => {
      db.exec({
        sql: deleteMapMarkerQuery,
        bind: {
          $player_id: playerId,
          $tile_id: tileId,
        },
      });

      db.exec({
        sql: insertMapMarkerQuery,
        bind: {
          $player_id: playerId,
          $tile_id: tileId,
          $description: description,
          $color: color,
          $icon: icon,
        },
      });
    });
  },
);

export const removeMapMarker = createController(
  '/me/map-markers/:tileId',
  'delete',
  {
    summary: 'Remove map marker',
    requestParams: {
      path: z.strictObject({
        tileId: z.coerce.number().pipe(tileIdSchema),
      }),
    },
  },
)(({ database, context: { playerId }, path: { tileId } }) => {
  database.exec({
    sql: deleteMapMarkerQuery,
    bind: {
      $player_id: playerId,
      $tile_id: tileId,
    },
  });
});

export const getTiles = createController('/tiles', {
  summary: 'Get all tiles',
  response: z.array(mapTileDtoSchema.nullable()),
})(({ database }) => {
  const parsedTiles = database.selectValue({
    sql: selectMapTilesQuery,
    schema: getTilesJsonSchema,
  })!;

  const mapSize = database.selectValue({
    sql: selectServerMapSizeQuery,
    schema: z.number(),
  })!;

  const { totalTiles } = calculateGridLayout(mapSize);

  const tiles = Array.from<z.infer<typeof getTilesSchema> | null>({
    length: totalTiles,
  }).fill(null);

  for (const tile of parsedTiles) {
    tiles[tile.id - 1] = tile;
  }

  // Map to DTOs preserving nulls/positions
  return tiles.map((row) => (row ? mapTile(row) : null));
});

export const getTileTroops = createController('/tiles/:tileId/troops', {
  summary: 'Get troops on a tile',
  requestParams: {
    path: z.strictObject({
      tileId: z.coerce.number().pipe(tileIdSchema),
    }),
  },
  response: z.array(mapTileTroopDtoSchema),
})(({ database, path: { tileId } }) => {
  const rows = database.selectObjects({
    sql: selectTileTroopsQuery,
    bind: {
      $tile_id: tileId,
    },
    schema: getTileTroopsSchema,
  });

  return rows.map(mapTileTroop);
});

export const getTileOasisBonuses = createController('/tiles/:tileId/bonuses', {
  summary: 'Get oasis bonuses on a tile',
  requestParams: {
    path: z.strictObject({
      tileId: z.coerce.number().pipe(tileIdSchema),
    }),
  },
  response: z.array(mapTileOasisBonusDtoSchema),
})(({ database, path: { tileId } }) => {
  const rows = database.selectObjects({
    sql: selectTileOasisBonusesQuery,
    bind: {
      $tile_id: tileId,
    },
    schema: getTileOasisBonusesSchema,
  });

  return rows.map(mapTileOasisBonus);
});
