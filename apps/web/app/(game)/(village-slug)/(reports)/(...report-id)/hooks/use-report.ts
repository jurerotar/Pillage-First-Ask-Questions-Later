import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type { ReportListingDto } from '@pillage-first/types/dtos/report';
import type { BaseReport } from '@pillage-first/types/models/report';
import {
  reportListingsCacheKey,
  reportsCacheKey,
  unreadReportCountQueryKey,
} from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';

const markRead = <T extends { isRead: boolean }>(report: T): T => {
  if (report.isRead) {
    return report;
  }

  return { ...report, isRead: true };
};

export const useReport = (reportId: BaseReport['id']) => {
  const { apiClient } = use(ApiContext);
  const queryClient = useQueryClient();

  const { data: report } = useSuspenseQuery({
    queryKey: [reportsCacheKey, reportId],
    queryFn: async () => {
      const { data } = await apiClient.get('/reports/:reportId', {
        path: {
          reportId,
        },
      });

      if (!data) {
        return data;
      }

      queryClient.setQueriesData<ReportListingDto[]>(
        {
          queryKey: [reportListingsCacheKey],
          predicate: (query) => query.queryKey[2] === 'unread',
        },
        (reports) => reports?.filter(({ id }) => id !== reportId),
      );

      queryClient.setQueriesData<ReportListingDto[]>(
        {
          queryKey: [reportListingsCacheKey],
          predicate: ({ queryKey }) =>
            queryKey[2] !== 'unread' &&
            queryKey[1] !== unreadReportCountQueryKey,
        },
        (reports) =>
          reports?.map((report) =>
            report.id === reportId ? markRead(report) : report,
          ),
      );

      void queryClient.invalidateQueries({
        queryKey: [reportListingsCacheKey, unreadReportCountQueryKey],
      });

      return data;
    },
  });

  return {
    report,
  };
};
