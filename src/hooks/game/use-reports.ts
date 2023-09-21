import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { Report } from 'interfaces/models/game/report';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';
import { useDatabaseMutation } from 'hooks/database/use-database-mutation';

const cacheKey = 'reports';

export const useReports = () => {
  const { serverId, hasLoadedServer } = useCurrentServer();
  const { mutate: mutateReports } = useDatabaseMutation({ cacheKey });

  const {
    data: reports,
    isLoading: isLoadingReports,
    isSuccess: hasLoadedReports,
    status: reportsQueryStatus
  } = useAsyncLiveQuery<Report[]>({
    queryFn: () => database.reports.where({ serverId }).toArray(),
    deps: [serverId],
    fallback: [],
    cacheKey,
    enabled: hasLoadedServer
  });

  const archivedReports = reports.filter((report: Report) => true);
  const unArchivedReports = reports.filter((report: Report) => false);

  const createReport = () => {

  };

  const deleteReport = async (reportId: Report['id']) => {
    await mutateReports(async () => {
      await database.reports.where({ serverId, id: reportId }).delete();
    });
  };

  const markAsRead = async (reportId: Report['id']) => {
    await mutateReports(async () => {
      await database.reports.where({ serverId, id: reportId }).delete();
    });
  };

  const markAsUnread = async (reportId: Report['id']) => {
    await mutateReports(async () => {
      await database.reports.where({ serverId, id: reportId }).modify({ opened: false });
    });
  };

  const archiveReport = async (reportId: Report['id']) => {
    await mutateReports(async () => {
      await database.reports.where({ serverId, id: reportId }).modify({ archived: true });
    });
  };

  const unArchiveReport = async (reportId: Report['id']) => {
    await mutateReports(async () => {
      await database.reports.where({ serverId, id: reportId }).modify({ archived: false });
    });
  };

  return {
    reports,
    isLoadingReports,
    hasLoadedReports,
    reportsQueryStatus,
    archivedReports,
    unArchivedReports,
    createReport,
    deleteReport,
    markAsRead,
    markAsUnread,
    archiveReport,
    unArchiveReport
  };
};
