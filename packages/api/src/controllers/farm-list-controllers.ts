import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { createController } from '../utils/controller';
import {
  farmListSchema,
  farmListTileSchema,
} from './schemas/farm-list-schemas';

export const getMeFarmLists = createController('/players/:playerId/farm-lists')(
  ({ database }) => {
    return database.selectObjects({
      sql: `
        SELECT fl.id, fl.name, fl.village_id AS villageId, (SELECT COUNT(*) FROM farm_list_tiles WHERE farm_list_id = fl.id) AS targetCount
        FROM farm_lists fl
        JOIN villages v ON v.id = fl.village_id
        WHERE v.player_id = $player_id
      `,
      bind: { $player_id: PLAYER_ID },
      schema: farmListSchema,
    });
  },
);

export const getFarmLists = createController('/villages/:villageId/farm-lists')(
  ({ database, path: { villageId } }) => {
    return database.selectObjects({
      sql: 'SELECT id, name, village_id AS villageId, (SELECT COUNT(*) FROM farm_list_tiles WHERE farm_list_id = id) AS targetCount FROM farm_lists WHERE village_id = $village_id',
      bind: { $village_id: villageId },
      schema: farmListSchema,
    });
  },
);

export const createFarmList = createController(
  '/villages/:villageId/farm-lists',
  'post',
)(({ database, path: { villageId }, body: { name } }) => {
  database.exec({
    sql: 'INSERT INTO farm_lists (village_id, name) VALUES ($village_id, $name)',
    bind: { $village_id: villageId, $name: name },
  });
});

export const getFarmList = createController('/farm-lists/:farmListId')(
  ({ database, path: { farmListId } }) => {
    const farmList = database.selectObject({
      sql: 'SELECT id, name, village_id AS villageId, (SELECT COUNT(*) FROM farm_list_tiles WHERE farm_list_id = $farmListId) AS targetCount FROM farm_lists WHERE id = $farmListId',
      bind: { $farmListId: farmListId },
      schema: farmListSchema,
    })!;

    const tiles = database.selectObjects({
      sql: 'SELECT tile_id FROM farm_list_tiles WHERE farm_list_id = $farmListId',
      bind: { $farmListId: farmListId },
      schema: farmListTileSchema,
    });

    return {
      ...farmList,
      tileIds: tiles,
    };
  },
);

export const deleteFarmList = createController(
  '/farm-lists/:farmListId',
  'delete',
)(({ database, path: { farmListId } }) => {
  database.exec({
    sql: 'DELETE FROM farm_lists WHERE id = $farmListId',
    bind: { $farmListId: farmListId },
  });
});

export const addTileToFarmList = createController(
  '/farm-lists/:farmListId/tiles',
  'post',
)(({ database, path: { farmListId }, body: { tileId } }) => {
  database.transaction(() => {
    const count = database.selectValue({
      sql: 'SELECT COUNT(*) FROM farm_list_tiles WHERE farm_list_id = $farmListId',
      bind: { $farmListId: farmListId },
      schema: z.number(),
    })!;

    if (count >= 100) {
      throw new Error('Farm list cannot have more than 100 tiles');
    }

    database.exec({
      sql: 'INSERT OR IGNORE INTO farm_list_tiles (farm_list_id, tile_id) VALUES ($farmListId, $tile_id)',
      bind: { $farmListId: farmListId, $tile_id: tileId },
    });
  });
});

export const removeTileFromFarmList = createController(
  '/farm-lists/:farmListId/tiles/:tileId',
  'delete',
)(({ database, path: { farmListId, tileId } }) => {
  database.exec({
    sql: 'DELETE FROM farm_list_tiles WHERE farm_list_id = $farmListId AND tile_id = $tile_id',
    bind: { $farmListId: farmListId, $tile_id: tileId },
  });
});

export const removeTileFromAllPlayerFarmLists = createController(
  '/players/:playerId/farm-lists/tiles',
  'delete',
)(({ database, body: { tileId } }) => {
  database.exec({
    sql: `
      DELETE FROM farm_list_tiles
      WHERE tile_id = $tile_id
        AND farm_list_id IN (
          SELECT fl.id
          FROM farm_lists fl
          JOIN villages v ON v.id = fl.village_id
          WHERE v.player_id = $player_id
        )
    `,
    bind: { $tile_id: tileId, $player_id: PLAYER_ID },
  });
});

export const cloneFarmList = createController(
  '/farm-lists/:farmListId/clone',
  'post',
)(({ database, path: { farmListId }, body: { villageId } }) => {
  database.transaction(() => {
    const sourceFarmList = database.selectObject({
      sql: 'SELECT name FROM farm_lists WHERE id = $farmListId',
      bind: { $farmListId: farmListId },
      schema: z.strictObject({
        name: z.string(),
      }),
    })!;

    database.exec({
      sql: 'INSERT INTO farm_lists (village_id, name) VALUES ($villageId, $name)',
      bind: { $villageId: villageId, $name: sourceFarmList.name },
    });

    const clonedFarmListId = database.selectValue({
      sql: 'SELECT last_insert_rowid()',
      schema: z.number(),
    })!;

    database.exec({
      sql: 'INSERT INTO farm_list_tiles (farm_list_id, tile_id) SELECT $clonedFarmListId, tile_id FROM farm_list_tiles WHERE farm_list_id = $farmListId',
      bind: { $clonedFarmListId: clonedFarmListId, $farmListId: farmListId },
    });
  });
});

export const updateFarmList = createController(
  '/farm-lists/:farmListId',
  'patch',
)(({ database, path: { farmListId }, body: { name, villageId } }) => {
  database.transaction(() => {
    if (name !== undefined) {
      database.exec({
        sql: 'UPDATE farm_lists SET name = $name WHERE id = $farmListId',
        bind: { $name: name, $farmListId: farmListId },
      });
    }
    if (villageId !== undefined) {
      database.exec({
        sql: 'UPDATE farm_lists SET village_id = $villageId WHERE id = $farmListId',
        bind: { $villageId: villageId, $farmListId: farmListId },
      });
    }
  });
});

export const renameFarmList = createController(
  '/farm-lists/:farmListId/rename',
  'patch',
)(({ database, path: { farmListId }, body: { name } }) => {
  database.exec({
    sql: 'UPDATE farm_lists SET name = $name WHERE id = $farmListId',
    bind: { $name: name, $farmListId: farmListId },
  });
});
