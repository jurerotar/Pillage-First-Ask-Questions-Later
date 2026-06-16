import { z } from 'zod';
import {
  mapMarkerDtoSchema,
  mapTileDtoSchema,
  mapTileOasisBonusDtoSchema,
  mapTileTroopDtoSchema,
  mapTileWorldItemDtoSchema,
} from '@pillage-first/types/dtos/map';
import { calculateGridLayout } from '@pillage-first/utils/map';
import {
  deleteMapMarkerQuery,
  insertMapMarkerQuery,
  selectMapTilesQuery,
  selectPlayerMapMarkersQuery,
  selectTileOasisBonusesQuery,
  selectTileTroopsQuery,
  selectTileWorldItemQuery,
} from '../../queries/map-queries';
import { selectServerMapSizeQuery } from '../../queries/server-queries';
import { createController } from '../controller';
import {
  mapMarker,
  mapTile,
  mapTileOasisBonus,
  mapTileTroop,
  mapTileWorldItem,
} from './mappers/map-mapper';
import {
  getMapMarkersSchema,
  getTileOasisBonusesSchema,
  getTilesSchema,
  getTileTroopsSchema,
  getTileWorldItemSchema,
} from './schemas/map-schemas';

export const getMapMarkers = createController(
  '/players/:playerId/map-markers',
  {
    summary: 'Get map markers',
    requestParams: {
      path: z.strictObject({
        playerId: z.coerce.number(),
      }),
    },
    response: z.array(mapMarkerDtoSchema),
  },
)(({ database, path: { playerId } }) => {
  const rows = database.selectObjects({
    sql: selectPlayerMapMarkersQuery,
    bind: {
      $player_id: playerId,
    },
    schema: getMapMarkersSchema,
  });

  return rows.map(mapMarker);
});

export const addMapMarker = createController(
  '/players/:playerId/map-markers',
  'post',
  {
    summary: 'Add map marker',
    requestParams: {
      path: z.strictObject({
        playerId: z.coerce.number(),
      }),
    },
    requestBody: z.strictObject({
      tileId: z.number(),
      description: z.string(),
      color: mapMarkerDtoSchema.shape.color,
    }),
  },
)(({ database, path: { playerId }, body: { tileId, description, color } }) => {
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
      },
    });
  });
});

export const removeMapMarker = createController(
  '/players/:playerId/map-markers/:tileId',
  'delete',
  {
    summary: 'Remove map marker',
    requestParams: {
      path: z.strictObject({
        playerId: z.coerce.number(),
        tileId: z.coerce.number(),
      }),
    },
  },
)(({ database, path: { playerId, tileId } }) => {
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
  const parsedTiles = database.selectObjects({
    sql: selectMapTilesQuery,
    schema: getTilesSchema,
  });

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
      tileId: z.coerce.number(),
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
      tileId: z.coerce.number(),
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

export const getTileWorldItem = createController('/tiles/:tileId/world-item', {
  summary: 'Get world item on a tile',
  requestParams: {
    path: z.strictObject({
      tileId: z.coerce.number(),
    }),
  },
  response: mapTileWorldItemDtoSchema.nullable(),
})(({ database, path: { tileId } }) => {
  const row =
    database.selectObject({
      sql: selectTileWorldItemQuery,
      bind: {
        $tile_id: tileId,
      },
      schema: getTileWorldItemSchema,
    }) ?? null;

  return row ? mapTileWorldItem(row) : null;
});
