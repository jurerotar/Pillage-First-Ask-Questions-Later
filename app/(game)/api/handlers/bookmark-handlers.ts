import { bookmarksCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { ApiHandler } from 'app/interfaces/api';
import type { Bookmarks } from 'app/interfaces/models/game/bookmark';

export const getBookmarks: ApiHandler<Bookmarks> = async (queryClient) => {
  const bookmarks = queryClient.getQueryData<Bookmarks>([bookmarksCacheKey])!;

  return bookmarks;
};

export const updateBookmark: ApiHandler<
  void,
  'buildingId',
  { tab: string }
> = async (queryClient, { params, body }) => {
  const { buildingId } = params;
  const { tab } = body;

  queryClient.setQueryData<Bookmarks>([bookmarksCacheKey], (bookmarks) => {
    return {
      ...bookmarks!,
      [buildingId]: tab,
    };
  });
};
