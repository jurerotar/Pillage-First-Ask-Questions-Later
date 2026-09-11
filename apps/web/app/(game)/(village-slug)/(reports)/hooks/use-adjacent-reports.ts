import type {
  ReportListingDto,
  ReportListingFilter,
} from '@pillage-first/types/dtos/report';
import { reportListingFilterSchema } from '@pillage-first/types/dtos/report';
import {
  type ReportScope,
  useReports,
} from 'app/(game)/(village-slug)/hooks/use-reports';

const isReportScope = (value: string | null): value is ReportScope =>
  value === 'global' ||
  value === 'unread' ||
  value === 'archived' ||
  value === 'village';

const isReportListingFilter = (value: string): value is ReportListingFilter =>
  reportListingFilterSchema.safeParse(value).success;

export const useAdjacentReports = (
  currentReportId: number,
  searchParams: URLSearchParams,
) => {
  const tabParam = searchParams.get('reports-tab');
  const scope: ReportScope = isReportScope(tabParam) ? tabParam : 'global';
  const filters = searchParams.getAll('scope').filter(isReportListingFilter);

  const { reports } = useReports(scope, filters);
  const currentIndex = reports.findIndex(
    (report: ReportListingDto) => report.id === currentReportId,
  );

  if (currentIndex === -1) {
    return { previousReportId: null, nextReportId: null };
  }

  return {
    previousReportId: currentIndex > 0 ? reports[currentIndex - 1].id : null,
    nextReportId:
      currentIndex < reports.length - 1 ? reports[currentIndex + 1].id : null,
  };
};
