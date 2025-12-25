import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { reportsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import type { Report, ReportTag } from 'app/interfaces/models/game/report';

export const useReports = () => {
  const { fetcher } = use(ApiContext);

  const { data: reports } = useSuspenseQuery<Report[]>({
    queryKey: [reportsCacheKey],
    queryFn: async () => {
      return [];
      // const { data } = await fetcher<Report[]>('/me/reports');
      // return data;
    },
  });

  const { mutate: tagReport } = useMutation<
    void,
    Error,
    { reportId: Report['id']; tag: ReportTag }
  >({
    mutationFn: async ({ reportId, tag }) => {
      await fetcher<Report[]>(`/reports/${reportId}`, {
        method: 'PATCH',
        body: {
          tag,
        },
      });
    },
  });

  const { mutate: deleteReport } = useMutation<
    void,
    Error,
    { reportId: Report['id'] }
  >({
    mutationFn: async ({ reportId }) => {
      await fetcher<Report[]>(`/reports/${reportId}`, {
        method: 'DELETE',
      });
    },
  });

  return {
    reports,
    tagReport,
    deleteReport,
  };
};
