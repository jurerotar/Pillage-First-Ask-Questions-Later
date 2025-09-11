import type { ApiHandler } from 'app/interfaces/api';
import { z } from 'zod';
import type { Bookmarks } from 'app/interfaces/models/game/bookmark';

const getBookmarksSchema = z
  .strictObject({
    building_id: z.string(),
    tab_name: z.string(),
  })
  .transform((t) => {
    return [t.building_id, t.tab_name];
  });

export const getBookmarks: ApiHandler<Bookmarks> = async (
  _queryClient,
  database,
) => {
  const bookmarks = database.selectObjects(
    'SELECT building_id, tab_name FROM bookmarks',
  );

  const listSchema = z.array(getBookmarksSchema);

  return Object.fromEntries(listSchema.parse(bookmarks));
};

export const updateBookmark: ApiHandler<
  void,
  'buildingId',
  { tab: string }
> = async (_queryClient, database, { params, body }) => {
  const { buildingId } = params;
  const { tab } = body;

  database.exec({
    sql: `
    UPDATE bookmarks
    SET tab_name = $tab_name
    WHERE building_id = $building_id;
  `,
    bind: {
      $tab_name: tab,
      $building_id: buildingId,
    },
  });
};
