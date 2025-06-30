import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import type { Report, ReportTag } from 'app/interfaces/models/game/report';
import { reportsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

type _ReportMark = ReportTag | `un${ReportTag}`;

// TODO: Finish this
// export const getReportIconType = ({ type }: Report): ReportIconType | MissingIconType => {
//   let iconType: ReportIconType | MissingIconType;
//
//   switch (true) {
//     case type === 'attack' && status === 'no-loss': {
//       iconType = 'attackerNoLoss';
//       break;
//     }
//     case type === 'attack' && status === 'some-loss': {
//       iconType = 'attackerSomeLoss';
//       break;
//     }
//     case type === 'attack' && status === 'full-loss': {
//       iconType = 'attackerFullLoss';
//       break;
//     }
//     case type === 'defence' && status === 'no-loss': {
//       iconType = 'defenderNoLoss';
//       break;
//     }
//     case type === 'defence' && status === 'some-loss': {
//       iconType = 'defenderSomeLoss';
//       break;
//     }
//     case type === 'defence' && status === 'full-loss': {
//       iconType = 'defenderFullLoss';
//       break;
//     }
//     default: {
//       iconType = 'missingIcon';
//     }
//   }
//
//   return iconType;
// };

export const useReports = () => {
  const { fetcher } = use(ApiContext);

  const { data: reports } = useSuspenseQuery<Report[]>({
    queryKey: [reportsCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<Report[]>('/me/reports');
      return data;
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
