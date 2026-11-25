import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import {
  reportListingsCacheKey,
  unreadReportCountQueryKey,
} from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';

export const useUnreadReportCount = () => {
  const { apiClient } = use(ApiContext);

  const { data } = useSuspenseQuery({
    queryKey: [reportListingsCacheKey, unreadReportCountQueryKey],
    queryFn: async () => {
      const { data } = await apiClient.get('/reports/unread-count');

      return data;
    },
  });

  return data;
};
