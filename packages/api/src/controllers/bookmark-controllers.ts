import {
  selectVillageBookmarksQuery,
  updateVillageBookmarkTabQuery,
} from '../queries/bookmark-queries';
import { getBookmarksSchema } from '../schemas/bookmark-schemas';
import { createController } from '../utils/controller';

export const getBookmarks = createController('/villages/:villageId/bookmarks')(
  ({ database, path: { villageId } }) => {
    const bookmarks = database.selectObjects({
      sql: selectVillageBookmarksQuery,
      bind: {
        $village_id: villageId,
      },
      schema: getBookmarksSchema,
    });

    return Object.fromEntries(bookmarks);
  },
);

export const updateBookmark = createController(
  '/villages/:villageId/bookmarks/:buildingId',
  'patch',
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
