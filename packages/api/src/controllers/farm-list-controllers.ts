import { z } from 'zod';
import type { Controller } from '../types/controller';
import {
  farmListSchema,
  farmListTileSchema,
} from './schemas/farm-list-schemas';

/**
 * GET /players/:playerId/farm-lists
 * @pathParam {number} playerId
 */
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

export type CreateFarmListBody = {
  name: string;
};

/**
 * POST /players/:playerId/farm-lists
 * @pathParam {number} playerId
 * @bodyContent application/json CreateFarmListBody
 * @bodyRequired
 */
export const createFarmList: Controller<
  '/players/:playerId/farm-lists',
  'post',
  CreateFarmListBody
> = (database, { params, body }) => {
  const { playerId } = params;
  const { name } = body;

  database.exec({
    sql: 'INSERT INTO farm_lists (player_id, name) VALUES ($playerId, $name)',
    bind: { $playerId: playerId, $name: name },
  });
};

/**
 * GET /farm-lists/:farmListId
 * @pathParam {number} farmListId
 */
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

/**
 * DELETE /farm-lists/:farmListId
 * @pathParam {number} farmListId
 */
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

export type AddTileToFarmListBody = {
  tileId: number;
};

/**
 * POST /farm-lists/:farmListId/tiles
 * @pathParam {number} farmListId
 * @bodyContent application/json AddTileToFarmListBody
 * @bodyRequired
 */
export const addTileToFarmList: Controller<
  '/farm-lists/:farmListId/tiles',
  'post',
  AddTileToFarmListBody
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

/**
 * DELETE /farm-lists/:farmListId/tiles/:tileId
 * @pathParam {number} farmListId
 * @pathParam {number} tileId
 */
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

export type RenameFarmListBody = {
  name: string;
};

/**
 * PATCH /farm-lists/:farmListId/rename
 * @pathParam {number} farmListId
 * @bodyContent application/json RenameFarmListBody
 * @bodyRequired
 */
export const renameFarmList: Controller<
  '/farm-lists/:farmListId/rename',
  'patch',
  RenameFarmListBody
> = (database, { params, body }) => {
  const { farmListId } = params;
  const { name } = body;

  database.exec({
    sql: 'UPDATE farm_lists SET name = $name WHERE id = $farmListId',
    bind: { $name: name, $farmListId: farmListId },
  });
};
