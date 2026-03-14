import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type { Bookmarks } from '@pillage-first/types/models/bookmark';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { bookmarksCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { invalidateQueries } from 'app/utils/react-query.ts';

type UpdateBookmarksArgs = {
  buildingId: keyof Bookmarks;
  tab: string;
};

export const useBookmarks = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: bookmarks } = useSuspenseQuery({
    queryKey: [bookmarksCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<Bookmarks>(
        `/villages/${currentVillage.id}/bookmarks`,
      );
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
      await fetcher(`/villages/${currentVillage.id}/bookmarks/${buildingId}`, {
        method: 'PATCH',
        body: {
          tab,
        },
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [[bookmarksCacheKey]]);
    },
  });

  return {
    bookmarks,
    updateBookmark,
  };
};
