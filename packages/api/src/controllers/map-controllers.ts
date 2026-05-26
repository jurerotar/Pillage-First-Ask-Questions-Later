import { z } from 'zod';
import { calculateGridLayout } from '@pillage-first/utils/map';
import { createController } from '../http/controller';
import {
  mapMarker,
  mapTile,
  mapTileOasisBonus,
  mapTileTroop,
  mapTileWorldItem,
} from '../mappers/map-mapper';
import {
  deleteMapMarkerQuery,
  insertMapMarkerQuery,
  selectMapTilesQuery,
  selectPlayerMapMarkersQuery,
  selectTileOasisBonusesQuery,
  selectTileTroopsQuery,
  selectTileWorldItemQuery,
} from '../queries/map-queries';
import { selectServerMapSizeQuery } from '../queries/server-queries';
import {
  getMapMarkersSchema,
  getTileOasisBonusesSchema,
  getTilesSchema,
  getTileTroopsSchema,
  getTileWorldItemSchema,
} from '../schemas/map-schemas';

export const getMapMarkers = createController('/players/:playerId/map-markers')(
  ({ database, path: { playerId } }) => {
    const rows = database.selectObjects({
      sql: selectPlayerMapMarkersQuery,
      bind: {
        $player_id: playerId,
      },
      schema: getMapMarkersSchema,
    });

    return rows.map(mapMarker);
  },
);

export const addMapMarker = createController(
  '/players/:playerId/map-markers',
  'post',
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
)(({ database, path: { playerId, tileId } }) => {
  database.exec({
    sql: deleteMapMarkerQuery,
    bind: {
      $player_id: playerId,
      $tile_id: tileId,
    },
  });
});

export const getTiles = createController('/tiles')(({ database }) => {
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

export const getTileTroops = createController('/tiles/:tileId/troops')(
  ({ database, path: { tileId } }) => {
    const rows = database.selectObjects({
      sql: selectTileTroopsQuery,
      bind: {
        $tile_id: tileId,
      },
      schema: getTileTroopsSchema,
    });

    return rows.map(mapTileTroop);
  },
);

export const getTileOasisBonuses = createController('/tiles/:tileId/bonuses')(
  ({ database, path: { tileId } }) => {
    const rows = database.selectObjects({
      sql: selectTileOasisBonusesQuery,
      bind: {
        $tile_id: tileId,
      },
      schema: getTileOasisBonusesSchema,
    });

    return rows.map(mapTileOasisBonus);
  },
);

export const getTileWorldItem = createController('/tiles/:tileId/world-item')(
  ({ database, path: { tileId } }) => {
    const row =
      database.selectObject({
        sql: selectTileWorldItemQuery,
        bind: {
          $tile_id: tileId,
        },
        schema: getTileWorldItemSchema,
      }) ?? null;

    return row ? mapTileWorldItem(row) : null;
  },
);
