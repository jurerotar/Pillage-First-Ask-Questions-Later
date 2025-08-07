import type { ApiHandler } from 'app/interfaces/api';
import { reportsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { Report, ReportTag } from 'app/interfaces/models/game/report';

export const getReports: ApiHandler<Report[]> = async (
  queryClient,
  _database,
) => {
  const reports = queryClient.getQueryData<Report[]>([reportsCacheKey]) ?? [];
  return reports;
};

export const getArchivedReports: ApiHandler<Report[]> = async (
  queryClient,
  _database,
) => {
  const reports = queryClient.getQueryData<Report[]>([reportsCacheKey]) ?? [];
  return reports.filter((report) => report.tags.includes('archived'));
};

export const getReportsByVillage: ApiHandler<Report[], 'villageId'> = async (
  queryClient,
  _database,
  { params },
) => {
  const { villageId: villageIdParam } = params;
  const villageId = Number.parseInt(villageIdParam);

  const reports = queryClient.getQueryData<Report[]>([reportsCacheKey]) ?? [];
  return reports.filter((report) => report.villageId === villageId);
};

export const getReportById: ApiHandler<Report, 'reportId'> = async (
  queryClient,
  _database,
  { params },
) => {
  const { reportId } = params;

  const reports = queryClient.getQueryData<Report[]>([reportsCacheKey]) ?? [];
  const report = reports.find(({ id }) => id === reportId);

  if (!report) {
    throw new Error('Report not found');
  }

  return report;
};

export const patchReport: ApiHandler<
  void,
  'reportId',
  { tag: ReportTag }
> = async (queryClient, _database, { params, body }) => {
  const reports = queryClient.getQueryData<Report[]>([reportsCacheKey]) ?? [];

  const updatedReports = reports.map((report) => {
    if (report.id !== params.reportId) {
      return report;
    }

    const hasTag = report.tags.includes(body.tag);
    const updatedTags = hasTag
      ? report.tags.filter((t) => t !== body.tag)
      : [...report.tags, body.tag];

    return {
      ...report,
      tags: updatedTags,
    };
  });

  queryClient.setQueryData<Report[]>([reportsCacheKey], updatedReports);
};

export const patchMultipleReports: ApiHandler<
  void,
  '',
  { reportIds: Report['id'][]; tag: ReportTag }
> = async (queryClient, _database, { body }) => {
  const { reportIds, tag } = body;

  const reports = queryClient.getQueryData<Report[]>([reportsCacheKey]) ?? [];

  const updatedReports = reports.map((report) => {
    if (!reportIds.includes(report.id)) {
      return report;
    }

    const hasTag = report.tags.includes(tag);
    const updatedTags = hasTag
      ? report.tags.filter((t) => t !== tag)
      : [...report.tags, tag];

    return { ...report, tags: updatedTags };
  });

  queryClient.setQueryData([reportsCacheKey], updatedReports);
};

export const deleteReport: ApiHandler<void, 'reportId'> = async (
  queryClient,
  _database,
  { params },
) => {
  const { reportId } = params;

  const reports = queryClient.getQueryData<Report[]>([reportsCacheKey]) ?? [];

  const updatedReports = reports.filter((report) => report.id !== reportId);

  queryClient.setQueryData<Report[]>([reportsCacheKey], updatedReports);
};

export const deleteMultipleReports: ApiHandler<
  void,
  '',
  { reportIds: Report['id'][] }
> = async (queryClient, _database, { body }) => {
  const { reportIds } = body;
  const reports = queryClient.getQueryData<Report[]>([reportsCacheKey]) ?? [];

  const updatedReports = reports.filter(
    (report) => !reportIds.includes(report.id),
  );

  queryClient.setQueryData([reportsCacheKey], updatedReports);
};
