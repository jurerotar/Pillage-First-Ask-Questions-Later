import { z } from 'zod';
import type { Controller } from '../types/controller';
import {
  farmListSchema,
  farmListTileSchema,
} from './schemas/farm-list-schemas';

export const getFarmLists: Controller<'/players/:playerId/farm-lists'> = (
  database,
  { params },
) => {
  const { playerId } = params;

  return database.selectObjects({
    sql: 'SELECT id, name FROM farm_lists WHERE player_id = $playerId',
    bind: { $playerId: playerId },
    schema: farmListSchema,
  });
};

export const createFarmList: Controller<
  '/players/:playerId/farm-lists',
  'post'
> = (database, { params, body }) => {
  const { playerId } = params;
  const { name } = body;

  database.exec({
    sql: 'INSERT INTO farm_lists (player_id, name) VALUES ($playerId, $name)',
    bind: { $playerId: playerId, $name: name },
  });
};

export const getFarmList: Controller<'/farm-lists/:farmListId'> = (
  database,
  { params },
) => {
  const { farmListId } = params;

  const farmList = database.selectObject({
    sql: 'SELECT id, name FROM farm_lists WHERE id = $farmListId',
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
};

export const deleteFarmList: Controller<'/farm-lists/:farmListId', 'delete'> = (
  database,
  { params },
) => {
  const { farmListId } = params;

  database.exec({
    sql: 'DELETE FROM farm_lists WHERE id = $farmListId',
    bind: { $farmListId: farmListId },
  });
};

export const addTileToFarmList: Controller<
  '/farm-lists/:farmListId/tiles',
  'post'
> = (database, { params, body }) => {
  const { farmListId } = params;
  const { tileId } = body;

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
      sql: 'INSERT OR IGNORE INTO farm_list_tiles (farm_list_id, tile_id) VALUES ($farmListId, $tileId)',
      bind: { $farmListId: farmListId, $tileId: tileId },
    });
  });
};

export const removeTileFromFarmList: Controller<
  '/farm-lists/:farmListId/tiles/:tileId',
  'delete'
> = (database, { params }) => {
  const { farmListId, tileId } = params;

  database.exec({
    sql: 'DELETE FROM farm_list_tiles WHERE farm_list_id = $farmListId AND tile_id = $tileId',
    bind: { $farmListId: farmListId, $tileId: tileId },
  });
};

export const renameFarmList: Controller<
  '/farm-lists/:farmListId/rename',
  'patch'
> = (database, { params, body }) => {
  const { farmListId } = params;
  const { name } = body;

  database.exec({
    sql: 'UPDATE farm_lists SET name = $name WHERE id = $farmListId',
    bind: { $name: name, $farmListId: farmListId },
  });
};
