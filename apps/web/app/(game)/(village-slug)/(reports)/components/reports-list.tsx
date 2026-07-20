import type { ReportListingDto } from '@pillage-first/types/dtos/report';
import type { ReportType } from '@pillage-first/types/models/report';
import { Section } from 'app/(game)/(village-slug)/components/building-layout';
import { usePagination } from 'app/(game)/(village-slug)/hooks/use-pagination';
import {
  type ReportScope,
  useReports,
} from 'app/(game)/(village-slug)/hooks/use-reports';
import { Pagination } from 'app/components/ui/pagination';
import { useReportSelection } from '../hooks/use-report-selection';
import { ReportsListActions } from './reports-list-actions';
import { ReportsListHeader } from './reports-list-header';
import { ReportsTable } from './reports-table';

const REPORTS_PER_PAGE = 20;

type ReportsListProps = {
  scope: ReportScope;
  page: number;
  reportFilters: ReportType[];
  handlePageChange: (newPage: number | ((prev: number) => number)) => void;
};

export const ReportsList = ({
  scope,
  page,
  reportFilters,
  handlePageChange,
}: ReportsListProps) => {
  const { reports, updateReports, deleteReports } = useReports(
    scope,
    reportFilters,
  );
  const pagination = usePagination(reports, REPORTS_PER_PAGE, page);
  const {
    selectedReportIds,
    allVisibleReportsSelected,
    toggleSelectedReport,
    toggleVisibleReports,
    clearSelectedReports,
  } = useReportSelection(pagination.currentPageItems);

  const markAsRead = (report: ReportListingDto) => {
    if (!report.tags.includes('read')) {
      updateReports({ reportIds: [report.id], addTags: ['read'] });
    }
  };

  return (
    <Section>
      <ReportsListHeader scope={scope} />
      <ReportsTable
        reports={pagination.currentPageItems}
        hasReports={reports.length > 0}
        selectedReportIds={selectedReportIds}
        allVisibleReportsSelected={allVisibleReportsSelected}
        onToggleReport={toggleSelectedReport}
        onToggleVisibleReports={toggleVisibleReports}
        onOpenReport={markAsRead}
      />
      <div className="flex w-full justify-between">
        <ReportsListActions
          scope={scope}
          selectedReportIds={selectedReportIds}
          updateReports={updateReports}
          deleteReports={deleteReports}
          clearSelectedReports={clearSelectedReports}
        />
        <Pagination
          {...pagination}
          setPage={handlePageChange}
        />
      </div>
    </Section>
  );
};
