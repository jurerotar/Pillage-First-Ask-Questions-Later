import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { Report, ReportTag } from 'interfaces/models/game/report';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Server } from 'interfaces/models/game/server';
import { Tile } from 'interfaces/models/game/tile';
import { ReportIconType } from 'components/icon';

type ReportMark = ReportTag | `un${ReportTag}`;

export const reportsCacheKey = 'reports';

export const getReports = (serverId: Server['id']) => database.reports.where({ serverId }).sortBy('timestamp');

// TODO: Finish this
export const getReportIconType = ({ type, status }: Report): ReportIconType => {
  if (type === 'attack') {
    if (status === 'no-loss') {
      return 'attackerNoLoss';
    }
    if (status === 'some-loss') {
      return 'attackerSomeLoss';
    }
    if (status === 'full-loss') {
      return 'attackerFullLoss';
    }
  }

  if (type === 'defence') {
    if (status === 'no-loss') {
      return 'defenderNoLoss';
    }
    if (status === 'some-loss') {
      return 'defenderSomeLoss';
    }
    if (status === 'full-loss') {
      return 'defenderFullLoss';
    }
  }
};

// TODO: Implement this
const markAs = (report: Report, as: ReportMark): Report => {
  return report;
};

export const useReports = () => {
  const { serverId } = useCurrentServer();
  const queryClient = useQueryClient();

  const {
    data: reports,
    isLoading: isLoadingReports,
    isSuccess: hasLoadedReports,
    status: reportsQueryStatus,
  } = useQuery<Report[]>({
    queryFn: () => getReports(serverId),
    queryKey: [reportsCacheKey, serverId],
    initialData: [],
  });

  const readReports = reports.filter(({ tags }) => tags.includes('read'));
  const deletedReports = reports.filter(({ tags }) => tags.includes('deleted'));
  const archivedReports = reports.filter(({ tags }) => tags.includes('archived'));

  const getReportsByTileId = (tileIdToSearchBy: Tile['tileId']): Report[] => {
    return reports.filter(({ tileId }) => tileId === tileIdToSearchBy);
  };

  const { mutate: createReport } = useMutation<void, Error, any>({
    mutationFn: async ({}) => {},
    onMutate: ({}) => {

    }
  });

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
    }
  });

  return {
    reports,
    isLoadingReports,
    hasLoadedReports,
    reportsQueryStatus,
    archivedReports,
    deletedReports,
    readReports,
    markReport,
    createReport,
    getReportsByTileId,
  };
};
