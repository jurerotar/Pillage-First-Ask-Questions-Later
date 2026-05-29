import { z } from 'zod';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import {
  selectVillageBookmarksQuery,
  updateVillageBookmarkTabQuery,
} from '../../queries/bookmark-queries';
import { createController } from '../controller';
import { getBookmarksSchema } from './schemas/bookmark-schemas';

export const getBookmarks = createController('/villages/:villageId/bookmarks', {
  summary: 'Get bookmarks',
  requestParams: {
    path: z.strictObject({
      villageId: z.coerce.number(),
    }),
  },
  response: z.record(z.string(), z.string()),
})(({ database, path: { villageId } }) => {
  const bookmarks = database.selectObjects({
    sql: selectVillageBookmarksQuery,
    bind: {
      $village_id: villageId,
    },
    schema: getBookmarksSchema,
  });

  return Object.fromEntries(bookmarks);
});

export const updateBookmark = createController(
  '/villages/:villageId/bookmarks/:buildingId',
  'patch',
  {
    summary: 'Update bookmark',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
        buildingId: buildingIdSchema,
      }),
    },
    requestBody: z.strictObject({
      tab: z.string(),
    }),
  },
)(({ database, path: { villageId, buildingId }, body: { tab } }) => {
  database.exec({
    sql: updateVillageBookmarkTabQuery,
    bind: {
      $tab_name: tab,
      $village_id: villageId,
      $building_id: buildingId,
    },
  });
});
