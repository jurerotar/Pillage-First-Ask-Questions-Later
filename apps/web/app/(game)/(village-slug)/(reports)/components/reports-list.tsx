import type {
  BaseReport,
  ReportTag,
  ReportType,
} from '@pillage-first/types/models/report';
import { Section } from 'app/(game)/(village-slug)/components/building-layout';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { usePagination } from 'app/(game)/(village-slug)/hooks/use-pagination';
import { useReports } from 'app/(game)/(village-slug)/hooks/use-reports';
import { Pagination } from 'app/components/ui/pagination';
import { useReportSelection } from '../hooks/use-report-selection';
import { ReportsListActions } from './reports-list-actions';
import { ReportsListHeader } from './reports-list-header';
import { ReportsTable } from './reports-table';
import type { ReportScope } from './reports-tabs';

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
  const { currentVillage } = useCurrentVillage();
  const { reports, updateReports, deleteReports } = useReports(
    scope,
    reportFilters,
  );
  const pagination = usePagination(reports, REPORTS_PER_PAGE, page);
  const {
    selectedReportIds,
    hasSelectedReports,
    allVisibleReportsSelected,
    toggleSelectedReport,
    toggleVisibleReports,
    clearSelectedReports,
  } = useReportSelection(pagination.currentPageItems);

  const updateSelectedReports = (tags: {
    addTags?: ReportTag[];
    removeTags?: ReportTag[];
  }) => {
    updateReports({ reportIds: selectedReportIds, ...tags });
    clearSelectedReports();
  };

  const markAsRead = (report: BaseReport) => {
    if (!report.tags.includes('READ')) {
      updateReports({ reportIds: [report.id], addTags: ['READ'] });
    }
  };

  const deleteSelectedReports = () => {
    deleteReports({ reportIds: selectedReportIds });
    clearSelectedReports();
  };

  return (
    <Section>
      <ReportsListHeader
        scope={scope}
        villageName={currentVillage.name}
      />
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
          disabled={!hasSelectedReports}
          onDelete={deleteSelectedReports}
          onMarkAsRead={() => updateSelectedReports({ addTags: ['READ'] })}
          onMarkAsUnread={() => updateSelectedReports({ removeTags: ['READ'] })}
          onArchive={() => updateSelectedReports({ addTags: ['ARCHIVED'] })}
          onUnarchive={() =>
            updateSelectedReports({ removeTags: ['ARCHIVED'] })
          }
        />
        <Pagination
          {...pagination}
          setPage={handlePageChange}
        />
      </div>
    </Section>
  );
};
