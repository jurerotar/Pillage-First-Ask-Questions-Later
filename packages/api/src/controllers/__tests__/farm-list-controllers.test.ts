import { describe, expect, test } from 'vitest';
import { prepareTestDatabase } from '@pillage-first/db';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  addTileToFarmList,
  createFarmList,
  deleteFarmList,
  getFarmList,
  getFarmLists,
  removeTileFromFarmList,
  renameFarmList,
} from '../farm-list-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('farm-list-controllers', () => {
  const playerId = PLAYER_ID;

  test('should manage farm lists', async () => {
    const database = await prepareTestDatabase();

    // 1. Create a farm list
    createFarmList(
      database,
      createControllerArgs<'/players/:playerId/farm-lists', 'post'>({
        params: { playerId },
        body: { name: 'My Farm List' },
      }),
    );

    // 2. Get farm lists
    const farmLists = getFarmLists(
      database,
      createControllerArgs<'/players/:playerId/farm-lists'>({
        params: { playerId },
      }),
    ) as any[];

    expect(farmLists).toHaveLength(1);
    expect(farmLists[0].name).toBe('My Farm List');
    const farmListId = farmLists[0].id;

    // 3. Add tiles to farm list
    addTileToFarmList(
      database,
      createControllerArgs<'/farm-lists/:farmListId/tiles', 'post'>({
        params: { farmListId },
        body: { tileId: 101 },
      }),
    );
    addTileToFarmList(
      database,
      createControllerArgs<'/farm-lists/:farmListId/tiles', 'post'>({
        params: { farmListId },
        body: { tileId: 102 },
      }),
    );

    // 4. Get farm list details
    let farmList = getFarmList(
      database,
      createControllerArgs<'/farm-lists/:farmListId'>({
        params: { farmListId },
      }),
    ) as any;

    expect(farmList.name).toBe('My Farm List');
    expect(farmList.tileIds).toContain(101);
    expect(farmList.tileIds).toContain(102);
    expect(farmList.tileIds).toHaveLength(2);

    // 5. Unique tile IDs (INSERT OR IGNORE)
    addTileToFarmList(
      database,
      createControllerArgs<'/farm-lists/:farmListId/tiles', 'post'>({
        params: { farmListId },
        body: { tileId: 101 },
      }),
    );
    farmList = getFarmList(
      database,
      createControllerArgs<'/farm-lists/:farmListId'>({
        params: { farmListId },
      }),
    );
    expect(farmList.tileIds).toHaveLength(2);

    // 6. Remove a tile
    removeTileFromFarmList(
      database,
      createControllerArgs<'/farm-lists/:farmListId/tiles/:tileId', 'delete'>({
        params: { farmListId, tileId: 101 },
      }),
    );
    farmList = getFarmList(
      database,
      createControllerArgs<'/farm-lists/:farmListId'>({
        params: { farmListId },
      }),
    );
    expect(farmList.tileIds).not.toContain(101);
    expect(farmList.tileIds).toHaveLength(1);

    // 7. Max 100 tiles limit
    for (let i = 0; i < 99; i++) {
      // We already have 1 tile (102). Adding 99 more makes it 100.
      addTileToFarmList(
        database,
        createControllerArgs<'/farm-lists/:farmListId/tiles', 'post'>({
          params: { farmListId },
          body: { tileId: 1000 + i },
        }),
      );
    }

    expect(() => {
      addTileToFarmList(
        database,
        createControllerArgs<'/farm-lists/:farmListId/tiles', 'post'>({
          params: { farmListId },
          body: { tileId: 9999 },
        }),
      );
    }).toThrow('Farm list cannot have more than 100 tiles');

    // 8. Rename farm list
    renameFarmList(
      database,
      createControllerArgs<'/farm-lists/:farmListId/rename', 'patch'>({
        params: { farmListId },
        body: { name: 'New Farm List Name' },
      }),
    );
    farmList = getFarmList(
      database,
      createControllerArgs<'/farm-lists/:farmListId'>({
        params: { farmListId },
      }),
    );
    expect(farmList.name).toBe('New Farm List Name');

    // 9. Delete farm list
    deleteFarmList(
      database,
      createControllerArgs<'/farm-lists/:farmListId', 'delete'>({
        params: { farmListId },
      }),
    );

    const farmListsAfterDelete = getFarmLists(
      database,
      createControllerArgs<'/players/:playerId/farm-lists'>({
        params: { playerId },
      }),
    );
    expect(farmListsAfterDelete).toHaveLength(0);
  });
});
