import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type { BaseReport, ReportTag } from '@pillage-first/types/models/report';
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
    queryKey: [unreadReportsCountCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get('/reports/:playerId/unread-count', {
        path: {
          playerId: player.id,
        },
      });
      return data;
    },
  });

  const { mutate: updateReports } = useMutation<
    void,
    Error,
    {
      reportIds: BaseReport['id'][];
      addTags?: ReportTag[];
      removeTags?: ReportTag[];
    }
  >({
    mutationFn: async (body) => {
      await apiClient.patch('/reports', { body });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [reportsCacheKey],
        [unreadReportsCountCacheKey],
      ]);
    },
  });

  const { mutate: deleteReports } = useMutation<
    void,
    Error,
    { reportIds: BaseReport['id'][] }
  >({
    mutationFn: async ({ reportIds }) => {
      await apiClient.delete('/reports', {
        body: reportIds,
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [reportsCacheKey],
        [unreadReportsCountCacheKey],
      ]);
    },
  });

  return {
    reports,
    unreadReportCount,
    updateReports,
    deleteReports,
  };
};
