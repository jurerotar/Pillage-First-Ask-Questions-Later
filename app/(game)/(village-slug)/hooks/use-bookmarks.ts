import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { bookmarksCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { Bookmarks } from 'app/interfaces/models/game/bookmark';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

type UpdateBookmarksArgs = {
  buildingId: keyof Bookmarks;
  tab: string;
};

export const useBookmarks = () => {
  const { fetcher } = use(ApiContext);
  const queryClient = useQueryClient();

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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [bookmarksCacheKey] });
    },
  });

  return {
    bookmarks,
    updateBookmark,
  };
};
