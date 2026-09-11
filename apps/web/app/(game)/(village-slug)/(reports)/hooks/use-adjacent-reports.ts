import type { ReportListingDto } from '@pillage-first/types/dtos/report';

export const useAdjacentReports = (
  currentReportId: number,
  reports: ReportListingDto[],
) => {
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
