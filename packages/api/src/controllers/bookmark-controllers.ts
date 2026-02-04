import { createController } from '../utils/controller';
import { getBookmarksSchema } from './schemas/bookmark-schemas';

export const getBookmarks = createController('/villages/:villageId/bookmarks')(
  ({ database, path: { villageId } }) => {
    const bookmarks = database.selectObjects({
      sql: 'SELECT building_id, tab_name FROM bookmarks WHERE village_id = $village_id;',
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
    sql: `
    UPDATE bookmarks
      SET tab_name = $tab_name
      WHERE building_id = $building_id
        AND village_id = $village_id;
  `,
    bind: {
      $tab_name: tab,
      $village_id: villageId,
      $building_id: buildingId,
    },
  });
});
