import type { Controller } from '../types/controller';
import { getBookmarksSchema } from './schemas/bookmark-schemas';

export const getBookmarks: Controller<'/villages/:villageId/bookmarks'> = (
  database,
  { params },
) => {
  const { villageId } = params;

  const bookmarks = database.selectObjects({
    sql: 'SELECT building_id, tab_name FROM bookmarks WHERE village_id = $village_id;',
    bind: {
      $village_id: villageId,
    },
    schema: getBookmarksSchema,
  });

  return Object.fromEntries(bookmarks);
};

export const updateBookmark: Controller<
  '/villages/:villageId/bookmarks/:buildingId',
  'patch'
> = (database, { params, body }) => {
  const { villageId, buildingId } = params;
  const { tab } = body;

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
};
