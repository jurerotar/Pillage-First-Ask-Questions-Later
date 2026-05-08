import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type { Report, ReportTag } from '@pillage-first/types/models/report';
import { useMe } from 'app/(game)/(village-slug)/hooks/use-me';
import { reportsCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useReports = () => {
  const { apiClient } = use(ApiContext);
  const { player } = useMe();

  const { data: reports } = useSuspenseQuery({
    queryKey: [reportsCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get('/players/:playerId/reports', {
        path: {
          playerId: player.id,
        },
      });
      return data;
    },
  });

  const { mutate: tagReport } = useMutation<
    void,
    Error,
    { reportId: Report['id']; tag: ReportTag }
  >({
    mutationFn: async ({ reportId, tag }) => {
      await apiClient.patch('/reports/:reportId', {
        path: { reportId },
        body: { tag },
      });
    },
  });

  const { mutate: deleteReport } = useMutation<
    void,
    Error,
    { reportId: Report['id'] }
  >({
    mutationFn: async ({ reportId }) => {
      await apiClient.delete('/reports/:reportId', {
        path: { reportId },
      });
    },
  });

  return {
    reports,
    tagReport,
    deleteReport,
  };
};
