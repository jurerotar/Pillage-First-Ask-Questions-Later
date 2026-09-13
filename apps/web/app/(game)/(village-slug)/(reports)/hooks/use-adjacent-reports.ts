import type { ReportListingDto } from '@pillage-first/types/dtos/report';

export const useAdjacentReports = (
  currentReportId: number,
  reports: ReportListingDto[],
) => {
  const currentIndex = reports.findIndex(
    (report: ReportListingDto) => report.id === currentReportId,
  );

  const findPreviousUnreadReportId = (endIndex: number) => {
    for (let index = endIndex - 1; index >= 0; index--) {
      const report = reports[index];

      if (!report.tags.includes('read')) {
        return report.id;
      }
    }

    return null;
  };

  const findNextUnreadReportId = (startIndex: number) => {
    for (let index = startIndex; index < reports.length; index++) {
      const report = reports[index];

      if (!report.tags.includes('read')) {
        return report.id;
      }
    }

    return null;
  };

  if (currentIndex === -1) {
    return {
      previousReportId: null,
      nextReportId: null,
      previousUnreadReportId: null,
      nextUnreadReportId: findNextUnreadReportId(0),
    };
  }

  return {
    previousReportId: currentIndex > 0 ? reports[currentIndex - 1].id : null,
    nextReportId:
      currentIndex < reports.length - 1 ? reports[currentIndex + 1].id : null,
    previousUnreadReportId: findPreviousUnreadReportId(currentIndex),
    nextUnreadReportId: findNextUnreadReportId(currentIndex + 1),
  };
};
