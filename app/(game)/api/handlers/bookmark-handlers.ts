import type { ApiHandler } from 'app/interfaces/api';
import { z } from 'zod';

const getBookmarksResponseSchema = z
  .strictObject({

  })
  .transform((t) => {
    return {

    };
  });

export const getBookmarks: ApiHandler<z.infer<typeof getBookmarksResponseSchema>> = async (
  _queryClient,
  database,
) => {
  const result = database.selectObjects(
    'SELECT building_id, tab_name FROM bookmarks',
  );

  return Object.fromEntries(
    result.map(({ building_id, tab_name }) => [building_id, tab_name]),
  );
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
