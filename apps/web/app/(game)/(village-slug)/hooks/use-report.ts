import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type { BaseReport } from '@pillage-first/types/models/report';
import { reportsCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';

export const useReport = (reportId: BaseReport['id']) => {
  const { apiClient } = use(ApiContext);

  const { data: report } = useSuspenseQuery({
    queryKey: [reportsCacheKey, reportId],
    queryFn: async () => {
      const { data } = await apiClient.get('/reports/:reportId', {
        path: {
          reportId,
        },
      });
      return data;
    },
  });

  return {
    report,
  };
};
