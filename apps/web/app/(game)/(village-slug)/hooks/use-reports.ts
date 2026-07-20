import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type {
  BaseReport,
  ReportTag,
  ReportType,
} from '@pillage-first/types/models/report';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { reportsCacheKey } from 'app/(game)/constants/query-keys';
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
    queryKey: [reportsCacheKey, currentVillage.id, scope, types],
    queryFn: async () => {
      const { data } = await apiClient.get(
        '/players/:playerId/reports/:villageId',
        {
          path: {
            playerId: player.id,
            villageId: currentVillage.id,
          },
          query: {
            scope,
            ...(types.length > 0 ? { types } : {}),
          },
        },
      );
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
      await invalidateQueries(context, [[reportsCacheKey]]);
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
      await invalidateQueries(context, [[reportsCacheKey]]);
    },
  });

  return {
    reports,
    updateReports,
    deleteReports,
  };
};
