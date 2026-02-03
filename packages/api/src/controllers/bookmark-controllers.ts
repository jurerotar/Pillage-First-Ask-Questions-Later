import type { Controller } from '../types/controller';
import { getBookmarksSchema } from './schemas/bookmark-schemas.ts';

/**
 * GET /villages/:villageId/bookmarks
 * @pathParam {number} villageId
 */
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

type UpdateBookmarkBody = {
  tab: string;
};

/**
 * PATCH /villages/:villageId/bookmarks/:buildingId
 * @pathParam {number} villageId
 * @pathParam {string} buildingId
 * @bodyContent application/json UpdateBookmarkBody
 * @bodyRequired
 */
export const updateBookmark: Controller<
  '/villages/:villageId/bookmarks/:buildingId',
  'patch',
  UpdateBookmarkBody
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
