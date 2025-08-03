import type { ApiHandler } from 'app/interfaces/api';
import { bookmarksCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { Bookmarks } from 'app/interfaces/models/game/bookmark';

export const getBookmarks: ApiHandler<Bookmarks> = async (
  queryClient,
  database,
) => {
  const _a = database.selectArrays('SELECT building_id, tab_id FROM bookmarks');

  const bookmarks = queryClient.getQueryData<Bookmarks>([bookmarksCacheKey])!;

  return bookmarks;
};

export const updateBookmark: ApiHandler<
  void,
  'buildingId',
  { tab: string }
> = async (queryClient, database, { params, body }) => {
  const { buildingId } = params;
  const { tab } = body;

  database.exec({
    sql: 'UPDATE bookmarks SET tab_id = ? WHERE building_id = ?',
    bind: [tab, buildingId],
  });

  queryClient.setQueryData<Bookmarks>([bookmarksCacheKey], (bookmarks) => {
    return {
      ...bookmarks!,
      [buildingId]: tab,
    };
  });
};
