import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type { BaseReport } from '@pillage-first/types/models/report';
import {
  reportsCacheKey,
  unreadReportsCountCacheKey,
} from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { invalidateQueries } from 'app/utils/react-query';
import { useMe } from './use-me';

export const useReports = () => {
  const { apiClient } = use(ApiContext);
  const { player } = useMe();

  const { data: reports } = useSuspenseQuery({
    queryKey: [reportsCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get('/reports/:playerId', {
        path: {
          playerId: player.id,
        },
      });
      return data;
    },
  });

  const { data: unreadReportCount } = useSuspenseQuery({
    queryKey: [unreadReportsCountCacheKey, player.id],
    queryFn: async () => {
      // TODO: decide on a cohesive naming scheme
      const { data } = await apiClient.get(
        '/players/:playerId/reports/unread-count',
        {
          path: {
            playerId: player.id,
          },
        },
      );
      return data;
    },
  });

  const { mutate: updateReport } = useMutation<
    void,
    Error,
    {
      reportId: BaseReport['id'];
      body: {
        isRead?: boolean;
        isArchived?: boolean;
      };
    }
  >({
    mutationFn: async ({ reportId, body }) => {
      await apiClient.patch('/reports/:reportId', {
        path: { reportId },
        body,
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [reportsCacheKey],
        [unreadReportsCountCacheKey, player.id],
      ]);
    },
  });

  // const { mutate: tagReport } = useMutation<
  //   void,
  //   Error,
  //   { reportId: Report['id']; tag: ReportTag }
  // >({
  //   mutationFn: async ({ reportId, tag }) => {
  //     await apiClient.patch('/reports/:reportId', {
  //       path: { reportId },
  //       body: { tag },
  //     });
  //   },
  // });

  // const { mutate: deleteReport } = useMutation<
  //   void,
  //   Error,
  //   { reportId: Report['id'] }
  // >({
  //   mutationFn: async ({ reportId }) => {
  //     await apiClient.delete('/reports/:reportId', {
  //       path: { reportId },
  //     });
  //   },
  // });

  return {
    reports,
    unreadReportCount,
    updateReport,
    // tagReport,
    // deleteReport,
  };
};
