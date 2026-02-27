import { createController } from '../utils/controller';
import { getBookmarksSchema } from './schemas/bookmark-schemas';

export const getBookmarks = createController('/villages/:villageId/bookmarks')(
  ({ database, path: { villageId } }) => {
    const bookmarks = database.selectObjects({
      sql: `
        SELECT bi.building AS building_id, b.tab_name
        FROM
          bookmarks b
            JOIN building_ids bi ON bi.id = b.building_id
        WHERE
          b.village_id = $village_id;
      `,
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
      WHERE building_id = (SELECT id FROM building_ids WHERE building = $building_id)
        AND village_id = $village_id;
  `,
    bind: {
      $tab_name: tab,
      $village_id: villageId,
      $building_id: buildingId,
    },
  });
});
