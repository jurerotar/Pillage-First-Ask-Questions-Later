import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type { ReportListingDto } from '@pillage-first/types/dtos/report';
import type { BaseReport, ReportTag } from '@pillage-first/types/models/report';
import {
  reportListingsCacheKey,
  reportsCacheKey,
} from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';

const markRead = <T extends { tags: ReportTag[] }>(report: T): T => {
  if (report.tags.includes('read')) {
    return report;
  }

  return { ...report, tags: [...report.tags, 'read'] };
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

      queryClient.setQueriesData<ReportListingDto[]>(
        { queryKey: [reportListingsCacheKey] },
        (reports) => {
          return reports!.map((report) =>
            report.id === reportId ? markRead(report) : report,
          );
        },
      );

      return data;
    },
  });

  return {
    report,
  };
};
