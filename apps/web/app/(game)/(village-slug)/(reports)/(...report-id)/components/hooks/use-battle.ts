import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type { BattleType } from '@pillage-first/types/models/battle';
import type { BaseReport } from '@pillage-first/types/models/report';
import { battleCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useBattle = (reportId: BaseReport['id']) => {
  const { apiClient } = use(ApiContext);

  const { data: battle } = useSuspenseQuery({
    queryKey: [battleCacheKey, reportId],
    queryFn: async (): Promise<BattleType> => {
      const { data } = await apiClient.get('/reports/battle/:reportId', {
        path: {
          reportId,
        },
      });

      return data as BattleType;
    },
  });

  return { battle };
};
