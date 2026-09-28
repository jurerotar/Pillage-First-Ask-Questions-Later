import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { useReports } from 'app/(game)/(village-slug)/hooks/use-reports';
import { reportTabs } from '../constants/report-tabs';
import { useReportFilters } from './use-report-filters';

export const useFilteredReports = () => {
  const { tabIndex, navigateToTab } = useTabParam(reportTabs, 'reports-tab');
  const scope = reportTabs[tabIndex] ?? reportTabs[0];
  const {
    filters: reportFilters,
    onFiltersChange: onReportFiltersChange,
    page,
    handlePageChange,
  } = useReportFilters(scope);
  const { reports, updateReports, deleteReports } = useReports(scope);

  return {
    scope,
    reports,
    updateReports,
    deleteReports,
    reportFilters,
    onReportFiltersChange,
    page,
    handlePageChange,
    navigateToTab,
  };
};
