import type { ReportListingDto } from '@pillage-first/types/dtos/report';
import { Section } from 'app/(game)/(village-slug)/components/building-layout';
import { usePagination } from 'app/(game)/(village-slug)/hooks/use-pagination';
import type { useReports } from 'app/(game)/(village-slug)/hooks/use-reports';
import { Pagination } from 'app/components/ui/pagination';
import { useReportSelection } from '../hooks/use-report-selection';
import { ReportsTable } from './reports-table';

const REPORTS_PER_PAGE = 20;

type ReportsListProps = {
  reports: ReportListingDto[];
  page: number;
  updateReports: ReturnType<typeof useReports>['updateReports'];
  deleteReports: ReturnType<typeof useReports>['deleteReports'];
  handlePageChange: (newPage: number | ((prev: number) => number)) => void;
};

export const ReportsList = ({
  reports,
  page,
  updateReports,
  deleteReports,
  handlePageChange,
}: ReportsListProps) => {
  const pagination = usePagination(reports, REPORTS_PER_PAGE, page);
  const {
    selectedReportIds,
    allVisibleReportsSelected,
    toggleSelectedReport,
    toggleVisibleReports,
    clearSelectedReports,
  } = useReportSelection(pagination.currentPageItems);

  return (
    <Section>
      <ReportsTable
        reports={pagination.currentPageItems}
        hasReports={reports.length > 0}
        selectedReportIds={selectedReportIds}
        allVisibleReportsSelected={allVisibleReportsSelected}
        onToggleReport={toggleSelectedReport}
        onToggleVisibleReports={toggleVisibleReports}
        updateReports={updateReports}
        deleteReports={deleteReports}
        clearSelectedReports={clearSelectedReports}
      />
      <div className="flex w-full justify-end">
        <Pagination
          {...pagination}
          setPage={handlePageChange}
        />
      </div>
    </Section>
  );
};
