import type { ApiHandler } from 'app/interfaces/api';
import type { Bookmarks } from 'app/interfaces/models/game/bookmark';

export const getBookmarks: ApiHandler<Bookmarks> = async (
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
    sql: 'UPDATE bookmarks SET tab_id = ? WHERE building_id = ?',
    bind: [tab, buildingId],
  });
};
