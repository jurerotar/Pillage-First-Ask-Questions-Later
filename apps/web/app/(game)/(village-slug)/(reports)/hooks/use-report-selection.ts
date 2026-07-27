import { useMemo, useState } from 'react';
import type { BaseReport } from '@pillage-first/types/models/report';

export const useReportSelection = (visibleReports: BaseReport[]) => {
  const [selectedReportIds, setSelectedReportIds] = useState<
    BaseReport['id'][]
  >([]);

  const visibleReportIds = useMemo(() => {
    return visibleReports.map((report) => report.id);
  }, [visibleReports]);

  const allVisibleReportsSelected =
    visibleReportIds.length > 0 &&
    visibleReportIds.every((reportId) => selectedReportIds.includes(reportId));

  const toggleSelectedReport = (reportId: BaseReport['id']) => {
    setSelectedReportIds((previousReportIds) =>
      previousReportIds.includes(reportId)
        ? previousReportIds.filter(
            (selectedReportId) => selectedReportId !== reportId,
          )
        : [...previousReportIds, reportId],
    );
  };

  const toggleVisibleReports = () => {
    setSelectedReportIds(allVisibleReportsSelected ? [] : visibleReportIds);
  };

  const clearSelectedReports = () => {
    setSelectedReportIds([]);
  };

  return {
    selectedReportIds,
    hasSelectedReports: selectedReportIds.length > 0,
    allVisibleReportsSelected,
    toggleSelectedReport,
    toggleVisibleReports,
    clearSelectedReports,
  };
};
