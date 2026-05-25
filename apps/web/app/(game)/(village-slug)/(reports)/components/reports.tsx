import { useTranslation } from 'react-i18next';
import { LuMail, LuMailOpen } from 'react-icons/lu';
import { Link } from 'react-router';
import { ReportFilters } from 'app/(game)/(village-slug)/(reports)/components/components/report-filters';
import { useReportFilters } from 'app/(game)/(village-slug)/(reports)/hooks/use-report-filters';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { usePagination } from 'app/(game)/(village-slug)/hooks/use-pagination';
import { useReports } from 'app/(game)/(village-slug)/hooks/use-reports';
import { Text } from 'app/components/text';
import { Alert } from 'app/components/ui/alert';
import { Pagination } from 'app/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';

export const Reports = () => {
  const { t } = useTranslation();
  const { reports } = useReports();
  const {
    filters: reportFilters,
    onFiltersChange: onReportFiltersChange,
    page,
    handlePageChange,
  } = useReportFilters();

  const visibleReports = reports.filter((r) => reportFilters.includes(r.type));
  const pagination = usePagination(visibleReports, 20, page);

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('All reports')}</Text>
        <Text>
          {t(
            'This is a categorized view of in-game reports. You can toggle different types of reports by using report filters below.',
          )}
        </Text>
      </SectionContent>
      <ReportFilters
        reportFilters={reportFilters}
        onChange={onReportFiltersChange}
      />

      {pagination.currentPageItems.length === 0 ? (
        <Alert variant="info">{t('No reports to display')}</Alert>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>{t('Type')}</TableHeaderCell>
              <TableHeaderCell>{t('Outcome')}</TableHeaderCell>
              <TableHeaderCell>{t('When')}</TableHeaderCell>
              <TableHeaderCell />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.currentPageItems.map((report) => {
              const isUnread = !report.tags.includes('read');
              return (
                <TableRow
                  key={report.id}
                  className={
                    isUnread ? 'bg-green-50 dark:bg-green-950/20' : undefined
                  }
                >
                  <TableCell>
                    <span className="flex items-center gap-2">
                      {isUnread ? (
                        <LuMail className="shrink-0 text-green-600" />
                      ) : (
                        <LuMailOpen className="shrink-0 text-muted-foreground" />
                      )}
                      <span className={isUnread ? 'font-semibold' : undefined}>
                        {t(report.type)}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className={isUnread ? 'font-semibold' : undefined}>
                    {t(report.outcome)}
                  </TableCell>
                  <TableCell className={isUnread ? 'font-semibold' : undefined}>
                    {new Date(report.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Link to={`./${report.id}`}>{t('View')}</Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <div className="flex w-full justify-end">
        <Pagination
          {...pagination}
          setPage={handlePageChange}
        />
      </div>
    </Section>
  );
};
