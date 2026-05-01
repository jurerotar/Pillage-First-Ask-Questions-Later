import { describe, expect, test } from 'vitest';
import { prepareTestDatabase } from '@pillage-first/db';
import {
  addTileToFarmList,
  cloneFarmList,
  createFarmList,
  deleteFarmList,
  getFarmList,
  getFarmLists,
  removeTileFromFarmList,
  renameFarmList,
} from '../farm-list-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('farm-list-controllers', () => {
  const villageId = 1;

  test('should manage farm lists', async () => {
    const database = await prepareTestDatabase();

    // 1. Create a farm list
    createFarmList(
      database,
      createControllerArgs<'/villages/:villageId/farm-lists', 'post'>({
        path: { villageId },
        body: { name: 'My Farm List' },
      }),
    );

    // 2. Get farm lists
    const farmLists = getFarmLists(
      database,
      createControllerArgs<'/villages/:villageId/farm-lists'>({
        path: { villageId },
      }),
    );

    expect(farmLists).toHaveLength(1);
    expect(farmLists[0].name).toBe('My Farm List');
    const farmListId = farmLists[0].id;

    // 3. Add tiles to farm list
    addTileToFarmList(
      database,
      createControllerArgs<'/farm-lists/:farmListId/tiles', 'post'>({
        path: { farmListId },
        body: { tileId: 101 },
      }),
    );
    addTileToFarmList(
      database,
      createControllerArgs<'/farm-lists/:farmListId/tiles', 'post'>({
        path: { farmListId },
        body: { tileId: 102 },
      }),
    );

    // 4. Get farm list details
    let farmList = getFarmList(
      database,
      createControllerArgs<'/farm-lists/:farmListId'>({
        path: { farmListId },
      }),
    );

    expect(farmList.name).toBe('My Farm List');
    expect(farmList.tileIds).toContain(101);
    expect(farmList.tileIds).toContain(102);
    expect(farmList.tileIds).toHaveLength(2);

    // 5. Unique tile IDs (INSERT OR IGNORE)
    addTileToFarmList(
      database,
      createControllerArgs<'/farm-lists/:farmListId/tiles', 'post'>({
        path: { farmListId },
        body: { tileId: 101 },
      }),
    );
    farmList = getFarmList(
      database,
      createControllerArgs<'/farm-lists/:farmListId'>({
        path: { farmListId },
      }),
    );
    expect(farmList.tileIds).toHaveLength(2);

    // 6. Remove a tile
    removeTileFromFarmList(
      database,
      createControllerArgs<'/farm-lists/:farmListId/tiles/:tileId', 'delete'>({
        path: { farmListId, tileId: 101 },
      }),
    );
    farmList = getFarmList(
      database,
      createControllerArgs<'/farm-lists/:farmListId'>({
        path: { farmListId },
      }),
    );
    expect(farmList.tileIds).not.toContain(101);
    expect(farmList.tileIds).toHaveLength(1);

    // 7. Max 100 tiles limit
    for (let i = 0; i < 99; i += 1) {
      // We already have 1 tile (102). Adding 99 more makes it 100.
      addTileToFarmList(
        database,
        createControllerArgs<'/farm-lists/:farmListId/tiles', 'post'>({
          path: { farmListId },
          body: { tileId: 1000 + i },
        }),
      );
    }

    expect(() => {
      addTileToFarmList(
        database,
        createControllerArgs<'/farm-lists/:farmListId/tiles', 'post'>({
          path: { farmListId },
          body: { tileId: 9999 },
        }),
      );
    }).toThrow('Farm list cannot have more than 100 tiles');

    // 8. Rename farm list
    renameFarmList(
      database,
      createControllerArgs<'/farm-lists/:farmListId/rename', 'patch'>({
        path: { farmListId },
        body: { name: 'New Farm List Name' },
      }),
    );
    farmList = getFarmList(
      database,
      createControllerArgs<'/farm-lists/:farmListId'>({
        path: { farmListId },
      }),
    );
    expect(farmList.name).toBe('New Farm List Name');

    // 9. Delete farm list
    deleteFarmList(
      database,
      createControllerArgs<'/farm-lists/:farmListId', 'delete'>({
        path: { farmListId },
      }),
    );

    const farmListsAfterDelete = getFarmLists(
      database,
      createControllerArgs<'/villages/:villageId/farm-lists'>({
        path: { villageId },
      }),
    );
    expect(farmListsAfterDelete).toHaveLength(0);
  });

  test('should clone farm list to another village without changing source', async () => {
    const database = await prepareTestDatabase();

    createFarmList(
      database,
      createControllerArgs<'/villages/:villageId/farm-lists', 'post'>({
        path: { villageId: 1 },
        body: { name: 'Source List' },
      }),
    );

    const sourceFarmListId = getFarmLists(
      database,
      createControllerArgs<'/villages/:villageId/farm-lists'>({
        path: { villageId: 1 },
      }),
    )[0].id;

    addTileToFarmList(
      database,
      createControllerArgs<'/farm-lists/:farmListId/tiles', 'post'>({
        path: { farmListId: sourceFarmListId },
        body: { tileId: 301 },
      }),
    );
    addTileToFarmList(
      database,
      createControllerArgs<'/farm-lists/:farmListId/tiles', 'post'>({
        path: { farmListId: sourceFarmListId },
        body: { tileId: 302 },
      }),
    );

    cloneFarmList(
      database,
      createControllerArgs<'/farm-lists/:farmListId/clone', 'post'>({
        path: { farmListId: sourceFarmListId },
        body: { villageId: 2 },
      }),
    );

    const sourceFarmList = getFarmList(
      database,
      createControllerArgs<'/farm-lists/:farmListId'>({
        path: { farmListId: sourceFarmListId },
      }),
    );

    const village2FarmLists = getFarmLists(
      database,
      createControllerArgs<'/villages/:villageId/farm-lists'>({
        path: { villageId: 2 },
      }),
    );

    expect(village2FarmLists).toHaveLength(1);

    const clonedFarmListId = village2FarmLists[0].id;
    const clonedFarmList = getFarmList(
      database,
      createControllerArgs<'/farm-lists/:farmListId'>({
        path: { farmListId: clonedFarmListId },
      }),
    );

    expect(clonedFarmListId).not.toBe(sourceFarmListId);
    expect(clonedFarmList.name).toBe('Source List');
    expect(clonedFarmList.tileIds).toEqual(sourceFarmList.tileIds);

    expect(sourceFarmList.name).toBe('Source List');
    expect(sourceFarmList.tileIds).toEqual([301, 302]);
  });
});
