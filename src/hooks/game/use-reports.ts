import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { Report } from 'interfaces/models/game/report';
import { useCallback } from 'react';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';

export const useReports = () => {
  const { serverId } = useCurrentServer();

  const {
    data: reports,
    isLoading: isLoadingReports,
    isSuccess: hasLoadedReports,
    status: reportsQueryStatus
  } = useAsyncLiveQuery<Report[]>(async () => {
    return database.reports.where({ serverId }).toArray();
  }, [serverId], []);

  const archivedReports = reports.filter((report: Report) => true);
  const unArchivedReports = reports.filter((report: Report) => false);

  const createReport = useCallback(() => {

  }, []);

  const deleteReport = useCallback(async (reportId: Report['id']) => {
    await database.reports.where({ serverId, id: reportId }).delete();
  }, [serverId]);

  const markAsRead = useCallback(async (reportId: Report['id']) => {
    await database.reports.where({ serverId, id: reportId }).modify({ opened: true });
  }, [serverId]);

  const markAsUnread = useCallback(async (reportId: Report['id']) => {
    await database.reports.where({ serverId, id: reportId }).modify({ opened: false });
  }, [serverId]);

  const archiveReport = useCallback(async (reportId: Report['id']) => {
    await database.reports.where({ serverId, id: reportId }).modify({ archived: true });
  }, [serverId]);

  const unArchiveReport = useCallback(async (reportId: Report['id']) => {
    await database.reports.where({ serverId, id: reportId }).modify({ archived: false });
  }, [serverId]);

  return {
    reports,
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
