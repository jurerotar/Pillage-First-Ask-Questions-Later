import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { Report, ReportTag } from 'interfaces/models/game/report';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Server } from 'interfaces/models/game/server';

type ReportMark = ReportTag | `un${ReportTag}`;

export const reportsCacheKey = 'reports';

export const getReports = (serverId: Server['id']) => database.reports.where({ serverId }).toArray();

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
  };
};
