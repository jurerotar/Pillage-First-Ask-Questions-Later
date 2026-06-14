import { useTranslation } from 'react-i18next';
import { ReportFilters } from 'app/(game)/(village-slug)/(reports)/components/components/report-filters';
import { useReportFilters } from 'app/(game)/(village-slug)/(reports)/hooks/use-report-filters';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { usePagination } from 'app/(game)/(village-slug)/hooks/use-pagination';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Text } from 'app/components/text';
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

  const { reports } = useReports();
  const pagination = usePagination(reports, 20, page);

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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>{t('Id')}</TableHeaderCell>
            <TableHeaderCell>{t('Type')}</TableHeaderCell>
            <TableHeaderCell>{t('Subject')}</TableHeaderCell>
            <TableHeaderCell>{t('Date')}</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagination.currentPageItems.map((report) => (
            <TableRow key={report.id}>
              <TableCell>
                <span className="inline-flex justify-center">{report.id}</span>
              </TableCell>
              <TableCell>{report.type}</TableCell>
              <TableCell />
              <TableCell>
                {new Date(report.timestamp * 1000).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
          {reports.length === 0 && (
            <TableRow>
              <TableCell
                colSpan="3"
                className="text-center py-8"
              >
                {t('No reports found yet.')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex w-full justify-end">
        <Pagination
          {...pagination}
          setPage={handlePageChange}
        />
      </div>
    </Section>
  );
};
