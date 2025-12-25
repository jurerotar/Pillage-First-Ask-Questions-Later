import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { bookmarksCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import type { Bookmarks } from 'app/interfaces/models/game/bookmark';

type UpdateBookmarksArgs = {
  buildingId: keyof Bookmarks;
  tab: string;
};

export const useBookmarks = () => {
  const { fetcher } = use(ApiContext);

  const { data: bookmarks } = useSuspenseQuery<Bookmarks>({
    queryKey: [bookmarksCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<Bookmarks>('/me/bookmarks');
      return data;
    },
    staleTime: Number.POSITIVE_INFINITY,
  });

  const { mutate: updateBookmark } = useMutation<
    void,
    Error,
    UpdateBookmarksArgs
  >({
    mutationFn: async ({ buildingId, tab }) => {
      await fetcher(`/me/bookmarks/${buildingId}`, {
        method: 'PATCH',
        body: {
          tab,
        },
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await context.client.invalidateQueries({ queryKey: [bookmarksCacheKey] });
    },
  });

  return {
    bookmarks,
    updateBookmark,
  };
};
