import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import type { BaseReport } from '@pillage-first/types/models/report';
import { ReportFilters } from 'app/(game)/(village-slug)/(reports)/components/components/report-filters';
import { useReportFilters } from 'app/(game)/(village-slug)/(reports)/hooks/use-report-filters';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { usePagination } from 'app/(game)/(village-slug)/hooks/use-pagination';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Icon } from 'app/components/icon';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import { Checkbox } from 'app/components/ui/checkbox';
import { Pagination } from 'app/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';
import { useReports } from '../../hooks/use-reports';

export const Reports = () => {
  const { t } = useTranslation();
  const {
    filters: reportFilters,
    onFiltersChange: onReportFiltersChange,
    page,
    handlePageChange,
  } = useReportFilters();

  const { reports, updateReports, deleteReports } = useReports();
  const pagination = usePagination(reports, 20, page);

  const [selected, setSelected] = useState<BaseReport['id'][]>([]);
  const toggleSelected = (reportId: BaseReport['id']) => {
    setSelected((prev) =>
      prev.includes(reportId)
        ? prev.filter((x) => x !== reportId)
        : [...prev, reportId],
    );
  };

  const toggleSelectedAll = () => {
    if (selected.length === pagination.currentPageItems.length) {
      setSelected([]);
    } else {
      const allIds = [];
      for (const report of pagination.currentPageItems) {
        allIds.push(report.id);
      }
      setSelected(allIds);
    }
  };

  const markAsRead = (report: BaseReport) => {
    if (!report.isRead) {
      updateReports({ reportIds: [report.id], isRead: true });
    }
  };

  const markSelectedAsRead = () => {
    updateReports({ reportIds: selected, isRead: true });
    setSelected([]);
  };

  const markSelectedAsArchived = () => {
    updateReports({ reportIds: selected, isArchived: true });
    setSelected([]);
  };

  const deleteSelected = () => {
    deleteReports({ reportIds: selected });
    setSelected([]);
  };

  return (
    <Section>
      <SectionContent>
        <InformationPopover ariaLabel={t('All reports')}>
          <Text>
            {t(
              'This is a categorized view of in-game reports. You can toggle different types of reports by using report filters below.',
            )}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('All reports')}</Text>
      </SectionContent>
      <ReportFilters
        reportFilters={reportFilters}
        onChange={onReportFiltersChange}
      />
      <div className="overflow-x-scroll scrollbar-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>
                {' '}
                <Checkbox
                  checked={
                    selected.length === pagination.currentPageItems.length
                  }
                  onCheckedChange={toggleSelectedAll}
                />
              </TableHeaderCell>
              <TableHeaderCell>{t('Subject')}</TableHeaderCell>
              <TableHeaderCell>{t('Date')}</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.currentPageItems.map((report) => (
              <TableRow key={report.id}>
                <TableCell>
                  {' '}
                  <Checkbox
                    checked={selected.includes(report.id)}
                    onCheckedChange={() => toggleSelected(report.id)}
                  />
                </TableCell>
                <TableCell className="flex gap-3 items-center">
                  <Icon type="attackerNoLoss" />
                  <Link
                    onClick={() => markAsRead(report)}
                    to={`../reports/${report.id}`}
                  >
                    <Text
                      className={
                        report.isRead
                          ? 'text-gray-700 font-normal'
                          : 'text-link font-medium'
                      }
                    >
                      {report.subject}
                    </Text>
                  </Link>
                  {report.isArchived && <Icon type="hero" />}
                </TableCell>
                <TableCell>
                  {new Date(report.timestamp).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
            {reports.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-8"
                >
                  {t('No reports found yet.')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex w-full justify-between">
        <div className="flex gap-3">
          <Button
            disabled={selected.length === 0}
            onClick={deleteSelected}
          >
            {t('Delete')}
          </Button>
          <Button
            disabled={selected.length === 0}
            onClick={markSelectedAsRead}
          >
            {t('Mark as read')}
          </Button>
          <Button
            disabled={selected.length === 0}
            onClick={markSelectedAsArchived}
          >
            {t('Mark as archived')}
          </Button>
        </div>
        <Pagination
          {...pagination}
          setPage={handlePageChange}
        />
      </div>
    </Section>
  );
};
