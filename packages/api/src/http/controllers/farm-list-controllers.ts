import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  farmListDetailsDtoSchema,
  farmListDtoSchema,
  updateFarmListDtoSchema,
} from '@pillage-first/types/dtos/farm-list';
import {
  deleteFarmListQuery,
  deleteFarmListTileQuery,
  deletePlayerFarmListTileQuery,
  insertClonedFarmListTilesQuery,
  insertFarmListQuery,
  insertFarmListTileQuery,
  selectFarmListNameQuery,
  selectFarmListQuery,
  selectFarmListTileCountQuery,
  selectFarmListTileIdsQuery,
  selectLastInsertedRowIdQuery,
  selectPlayerFarmListsQuery,
  selectVillageFarmListsQuery,
  updateFarmListNameQuery,
  updateFarmListVillageQuery,
} from '../../queries/farm-list-queries';
import { createController } from '../controller';
import {
  farmListSchema,
  farmListTileRowSchema,
} from './schemas/farm-list-schemas';

export const getMeFarmLists = createController(
  '/players/:playerId/farm-lists',
  {
    summary: 'Get player farm lists',
    requestParams: {
      path: z.strictObject({
        playerId: z.coerce.number(),
      }),
    },
    response: z.array(farmListDtoSchema),
  },
)(({ database }) => {
  return database.selectObjects({
    sql: selectPlayerFarmListsQuery,
    bind: { $player_id: PLAYER_ID },
    schema: farmListSchema,
  });
});

export const getFarmLists = createController(
  '/villages/:villageId/farm-lists',
  {
    summary: 'Get farm lists',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
      }),
    },
    response: z.array(farmListDtoSchema),
  },
)(({ database, path: { villageId } }) => {
  return database.selectObjects({
    sql: selectVillageFarmListsQuery,
    bind: { $village_id: villageId },
    schema: farmListSchema,
  });
});

export const createFarmList = createController(
  '/villages/:villageId/farm-lists',
  'post',
  {
    summary: 'Create farm list',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
      }),
    },
    requestBody: z.strictObject({
      name: z.string(),
    }),
  },
)(({ database, path: { villageId }, body: { name } }) => {
  database.exec({
    sql: insertFarmListQuery,
    bind: { $village_id: villageId, $name: name },
  });
});

export const getFarmList = createController('/farm-lists/:farmListId', {
  summary: 'Get farm list details',
  requestParams: {
    path: z.strictObject({
      farmListId: z.coerce.number(),
    }),
  },
  response: farmListDetailsDtoSchema,
})(({ database, path: { farmListId } }) => {
  const farmList = database.selectObject({
    sql: selectFarmListQuery,
    bind: { $farm_list_id: farmListId },
    schema: farmListSchema,
  })!;

  const tileRows = database.selectObjects({
    sql: selectFarmListTileIdsQuery,
    bind: { $farm_list_id: farmListId },
    schema: farmListTileRowSchema,
  });

  return {
    ...farmList,
    tileIds: tileRows.map((r) => r.tile_id),
  };
});

export const deleteFarmList = createController(
  '/farm-lists/:farmListId',
  'delete',
  {
    summary: 'Delete farm list',
    requestParams: {
      path: z.strictObject({
        farmListId: z.coerce.number(),
      }),
    },
  },
)(({ database, path: { farmListId } }) => {
  database.exec({
    sql: deleteFarmListQuery,
    bind: { $farm_list_id: farmListId },
  });
});

export const addTileToFarmList = createController(
  '/farm-lists/:farmListId/tiles',
  'post',
  {
    summary: 'Add tile to farm list',
    requestParams: {
      path: z.strictObject({
        farmListId: z.coerce.number(),
      }),
    },
    requestBody: z.strictObject({
      tileId: z.number(),
    }),
  },
)(({ database, path: { farmListId }, body: { tileId } }) => {
  database.transaction(() => {
    const count = database.selectValue({
      sql: selectFarmListTileCountQuery,
      bind: { $farm_list_id: farmListId },
      schema: z.number(),
    })!;

    if (count >= 100) {
      throw new Error('Farm list cannot have more than 100 tiles');
    }

    database.exec({
      sql: insertFarmListTileQuery,
      bind: { $farm_list_id: farmListId, $tile_id: tileId },
    });
  });
});

export const removeTileFromFarmList = createController(
  '/farm-lists/:farmListId/tiles/:tileId',
  'delete',
  {
    summary: 'Remove tile from farm list',
    requestParams: {
      path: z.strictObject({
        farmListId: z.coerce.number(),
        tileId: z.coerce.number(),
      }),
    },
  },
)(({ database, path: { farmListId, tileId } }) => {
  database.exec({
    sql: deleteFarmListTileQuery,
    bind: { $farm_list_id: farmListId, $tile_id: tileId },
  });
});

export const removeTileFromAllPlayerFarmLists = createController(
  '/players/:playerId/farm-lists/tiles',
  'delete',
  {
    summary: 'Remove tile from all player farm lists',
    requestParams: {
      path: z.strictObject({
        playerId: z.coerce.number(),
      }),
    },
    requestBody: z.strictObject({
      tileId: z.number(),
    }),
  },
)(({ database, body: { tileId } }) => {
  database.exec({
    sql: deletePlayerFarmListTileQuery,
    bind: { $tile_id: tileId, $player_id: PLAYER_ID },
  });
});

export const cloneFarmList = createController(
  '/farm-lists/:farmListId/clone',
  'post',
  {
    summary: 'Clone farm list to another village',
    requestParams: {
      path: z.strictObject({
        farmListId: z.coerce.number(),
      }),
    },
    requestBody: z.strictObject({
      villageId: z.number(),
    }),
  },
)(({ database, path: { farmListId }, body: { villageId } }) => {
  database.transaction(() => {
    const sourceFarmList = database.selectObject({
      sql: selectFarmListNameQuery,
      bind: { $farm_list_id: farmListId },
      schema: z.strictObject({
        name: z.string(),
      }),
    })!;

    database.exec({
      sql: insertFarmListQuery,
      bind: { $village_id: villageId, $name: sourceFarmList.name },
    });

    const clonedFarmListId = database.selectValue({
      sql: selectLastInsertedRowIdQuery,
      schema: z.number(),
    })!;

    database.exec({
      sql: insertClonedFarmListTilesQuery,
      bind: {
        $cloned_farm_list_id: clonedFarmListId,
        $farm_list_id: farmListId,
      },
    });
  });
});

export const updateFarmList = createController(
  '/farm-lists/:farmListId',
  'patch',
  {
    summary: 'Update farm list',
    requestParams: {
      path: z.strictObject({
        farmListId: z.coerce.number(),
      }),
    },
    requestBody: updateFarmListDtoSchema,
  },
)(({ database, path: { farmListId }, body: { name, villageId } }) => {
  database.transaction(() => {
    if (name !== undefined) {
      database.exec({
        sql: updateFarmListNameQuery,
        bind: { $name: name, $farm_list_id: farmListId },
      });
    }
    if (villageId !== undefined) {
      database.exec({
        sql: updateFarmListVillageQuery,
        bind: { $village_id: villageId, $farm_list_id: farmListId },
      });
    }
  });
});
