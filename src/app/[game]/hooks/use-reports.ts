import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import type { MissingIconType, ReportIconType } from 'app/components/icon';
import { database } from 'database/database';
import type { Report, ReportTag } from 'interfaces/models/game/report';
import type { Server } from 'interfaces/models/game/server';
import type { Tile } from 'interfaces/models/game/tile';

type ReportMark = ReportTag | `un${ReportTag}`;

export const reportsCacheKey = 'reports';

export const getReports = (serverId: Server['id']) => database.reports.where({ serverId }).sortBy('timestamp');

// TODO: Finish this
export const getReportIconType = ({ type, status }: Report): ReportIconType | MissingIconType => {
  let iconType: ReportIconType | MissingIconType;

  switch (true) {
    case type === 'attack' && status === 'no-loss': {
      iconType = 'attackerNoLoss';
      break;
    }
    case type === 'attack' && status === 'some-loss': {
      iconType = 'attackerSomeLoss';
      break;
    }
    case type === 'attack' && status === 'full-loss': {
      iconType = 'attackerFullLoss';
      break;
    }
    case type === 'defence' && status === 'no-loss': {
      iconType = 'defenderNoLoss';
      break;
    }
    case type === 'defence' && status === 'some-loss': {
      iconType = 'defenderSomeLoss';
      break;
    }
    case type === 'defence' && status === 'full-loss': {
      iconType = 'defenderFullLoss';
      break;
    }
    default: {
      iconType = 'missingIcon';
    }
  }

  return iconType;
};

// TODO: Implement this
const markAs = (report: Report, _as: ReportMark): Report => {
  return report;
};

export const useReports = () => {
  const { serverId } = useCurrentServer();
  const queryClient = useQueryClient();

  const { data: reports } = useQuery<Report[]>({
    queryFn: () => getReports(serverId),
    queryKey: [reportsCacheKey, serverId],
    initialData: [],
  });

  const readReports = reports.filter(({ tags }) => tags.includes('read'));
  const deletedReports = reports.filter(({ tags }) => tags.includes('deleted'));
  const archivedReports = reports.filter(({ tags }) => tags.includes('archived'));

  const getReportsByTileId = (tileIdToSearchBy: Tile['id']): Report[] => {
    return reports.filter(({ tileId }) => tileId === tileIdToSearchBy);
  };

  // const { mutate: createReport } = useMutation<void, Error, any>({
  //   mutationFn: async ({}) => {},
  //   onMutate: ({}) => {},
  // });

  const { mutate: markReport } = useMutation<void, Error, { reportId: Report['id']; as: ReportMark }>({
    mutationFn: async ({ reportId, as }) => {
      const report = reports.find(({ id }) => id === reportId)!;
      const { tags } = markAs(report, as);
      database.reports.where({ id: reportId }).modify({ tags });
    },
    onMutate: ({ reportId, as }) => {
      const report = reports.find(({ id }) => id === reportId)!;
      const markedReport = markAs(report, as);
      const clonedReports = [...reports];
      clonedReports[clonedReports.findIndex(({ id }) => id === reportId)] = markedReport;
      queryClient.setQueryData<Report[]>([reportsCacheKey, serverId], clonedReports);
    },
  });

  return {
    reports,
    archivedReports,
    deletedReports,
    readReports,
    markReport,
    // createReport,
    getReportsByTileId,
  };
};
