import { clsx } from 'clsx';
import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { LuEllipsis } from 'react-icons/lu';
import { Link } from 'react-router';
import type { ReportListingDto } from '@pillage-first/types/dtos/report';
import type { BaseReport } from '@pillage-first/types/models/report';
import type { useReports } from 'app/(game)/(village-slug)/hooks/use-reports';
import { Icon } from 'app/components/icon';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import { Checkbox } from 'app/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'app/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';
import { CookieContext } from 'app/providers/cookie-context';
import { getReportSubject } from '../utils/report-subject';
import { ReportsListActions } from './reports-list-actions';

const formatReportTimestamp = (
  timestamp: ReportListingDto['timestamp'],
  locale: string,
) => {
  const date = new Date(timestamp);
  const today = new Date();
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  return isToday
    ? date.toLocaleTimeString(locale, { timeStyle: 'short' })
    : date.toLocaleDateString(locale, { dateStyle: 'short' });
};

const formatFullReportTimestamp = (
  timestamp: ReportListingDto['timestamp'],
  locale: string,
) =>
  new Date(timestamp).toLocaleString(locale, {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

type ReportsTableProps = {
  reports: ReportListingDto[];
  hasReports: boolean;
  selectedReportIds: BaseReport['id'][];
  allVisibleReportsSelected: boolean;
  onToggleReport: (reportId: BaseReport['id']) => void;
  onToggleVisibleReports: () => void;
  onOpenReport: (report: ReportListingDto) => void;
  updateReports: ReturnType<typeof useReports>['updateReports'];
  deleteReports: ReturnType<typeof useReports>['deleteReports'];
  clearSelectedReports: () => void;
};

export const ReportsTable = ({
  reports,
  hasReports,
  selectedReportIds,
  allVisibleReportsSelected,
  onToggleReport,
  onToggleVisibleReports,
  onOpenReport,
  updateReports,
  deleteReports,
  clearSelectedReports,
}: ReportsTableProps) => {
  const { t } = useTranslation();
  const { locale } = use(CookieContext);
  const hasSelectedReports = selectedReportIds.length > 0;

  return (
    <div className="overflow-x-scroll scrollbar-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>
              <Checkbox
                checked={allVisibleReportsSelected}
                onCheckedChange={onToggleVisibleReports}
              />
            </TableHeaderCell>
            {hasSelectedReports ? (
              <TableHeaderCell
                colSpan={3}
                className="text-left"
              >
                <ReportsListActions
                  reports={reports.filter(({ id }) =>
                    selectedReportIds.includes(id),
                  )}
                  updateReports={updateReports}
                  deleteReports={deleteReports}
                  onAction={clearSelectedReports}
                />
              </TableHeaderCell>
            ) : (
              <>
                <TableHeaderCell>{t('Subject')}</TableHeaderCell>
                <TableHeaderCell>{t('Date')}</TableHeaderCell>
                <TableHeaderCell aria-label={t('Actions')} />
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id}>
              <TableCell>
                <Checkbox
                  checked={selectedReportIds.includes(report.id)}
                  onCheckedChange={() => onToggleReport(report.id)}
                />
              </TableCell>
              <TableCell className="text-left">
                <Link
                  onClick={() => onOpenReport(report)}
                  to={`../reports/${report.id}`}
                >
                  <Text
                    className={clsx(
                      'inline-flex gap-2 items-center',
                      report.tags.includes('read')
                        ? 'text-gray-700 font-normal'
                        : 'text-link font-medium',
                    )}
                  >
                    {report.tags.includes('archived') && (
                      <Icon type="archived" />
                    )}
                    <Icon type={report.outcome} />

                    {getReportSubject(report, t)}
                  </Text>
                </Link>
              </TableCell>
              <TableCell>
                <Text
                  className="leading-0 cursor-pointer"
                  data-tooltip-content={formatFullReportTimestamp(
                    report.timestamp,
                    locale,
                  )}
                  data-tooltip-id="general-tooltip"
                >
                  {formatReportTimestamp(report.timestamp, locale)}
                </Text>
              </TableCell>
              <TableCell>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      aria-label={t('Actions')}
                      title={t('Actions')}
                      variant="outline"
                      size="sm"
                    >
                      <LuEllipsis />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    className="w-auto rounded-lg p-1 shadow-xl"
                    side="bottom"
                  >
                    <ReportsListActions
                      reports={[report]}
                      updateReports={updateReports}
                      deleteReports={deleteReports}
                      isPopoverActions
                    />
                  </PopoverContent>
                </Popover>
              </TableCell>
            </TableRow>
          ))}
          {!hasReports && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-left"
              >
                {t('No reports found yet.')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
