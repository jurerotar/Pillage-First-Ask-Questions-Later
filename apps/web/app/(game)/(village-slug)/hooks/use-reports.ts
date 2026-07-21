import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type { ReportListingDto } from '@pillage-first/types/dtos/report';
import type {
  BaseReport,
  ReportTag,
  ReportType,
} from '@pillage-first/types/models/report';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import {
  reportListingsCacheKey,
  reportsCacheKey,
} from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { invalidateQueries } from 'app/utils/react-query';
import { useMe } from './use-me';

export type ReportScope = 'global' | 'unread' | 'archived' | 'village';

export const useReports = (
  scope: ReportScope = 'global',
  types: ReportType[] = [],
) => {
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();
  const { player } = useMe();

  const { data: reports } = useSuspenseQuery({
    queryKey: [reportListingsCacheKey, currentVillage.id, scope, types],
    queryFn: async () => {
      const { data } = await apiClient.get('/players/:playerId/reports', {
        path: {
          playerId: player.id,
        },
        query: {
          scope,
          ...(scope === 'village' ? { villageId: currentVillage.id } : {}),
          ...(types.length > 0 ? { types } : {}),
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
      tags: Partial<Record<ReportTag, boolean>>;
    }
  >({
    mutationFn: async (body) => {
      await apiClient.patch('/reports', { body });
    },
    onSuccess: async (_data, { reportIds }, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [reportListingsCacheKey],
        ...reportIds.map((reportId) => [reportsCacheKey, reportId]),
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
    onSuccess: (_data, { reportIds }, _onMutateResult, context) => {
      const deletedReportIds = new Set(reportIds);

      context.client.setQueriesData<ReportListingDto[]>(
        { queryKey: [reportListingsCacheKey] },
        (reports = []) => {
          return reports.filter((report) => !deletedReportIds.has(report.id));
        },
      );

      for (const reportId of reportIds) {
        context.client.removeQueries({
          queryKey: [reportsCacheKey, reportId],
          exact: true,
        });
      }
    },
  });

  return {
    reports,
    updateReports,
    deleteReports,
  };
};
