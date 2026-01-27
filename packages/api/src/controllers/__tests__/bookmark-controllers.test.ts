import { describe, expect, test } from 'vitest';
import { prepareTestDatabase } from '@pillage-first/db';
import { buildings } from '@pillage-first/game-assets/buildings';
import type { Building } from '@pillage-first/types/models/building';
import { getBookmarks, updateBookmark } from '../bookmark-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('bookmark-controllers', () => {
  test('getBookmarks should return bookmarks for all buildings', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;

    const result = getBookmarks(
      database,
      createControllerArgs<'/villages/:villageId/bookmarks'>({
        params: { villageId },
      }),
    ) as Record<Building['id'], string>;

    const buildingIds = buildings.map((b) => b.id);

    for (const buildingId of buildingIds) {
      expect(result).toHaveProperty(buildingId);
    }
    expect(true).toBeTruthy();
  });

  test('updateBookmark should update the bookmark correctly', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const buildingId: Building['id'] = 'WOODCUTTER';
    const newTabName = 'custom-tab';

    updateBookmark(
      database,
      createControllerArgs<
        '/villages/:villageId/bookmarks/:buildingId',
        'patch',
        { tab: string }
      >({
        params: { villageId, buildingId },
        body: { tab: newTabName },
      }),
    );

    const result = getBookmarks(
      database,
      createControllerArgs<'/villages/:villageId/bookmarks'>({
        params: { villageId },
      }),
    ) as Record<Building['id'], string>;

    expect(result[buildingId]).toBe(newTabName);
  });
});
