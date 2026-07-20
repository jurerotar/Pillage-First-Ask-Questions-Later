import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import type { ReportListingDto } from '@pillage-first/types/dtos/report';
import type { BaseReport } from '@pillage-first/types/models/report';
import { Icon } from 'app/components/icon';
import { Text } from 'app/components/text';
import { Checkbox } from 'app/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';
import { getReportSubject } from '../utils/report-subject';
import { ReportOutcomeIcon } from './report-outcome-icon';

type ReportsTableProps = {
  reports: ReportListingDto[];
  hasReports: boolean;
  selectedReportIds: BaseReport['id'][];
  allVisibleReportsSelected: boolean;
  onToggleReport: (reportId: BaseReport['id']) => void;
  onToggleVisibleReports: () => void;
  onOpenReport: (report: ReportListingDto) => void;
};

export const ReportsTable = ({
  reports,
  hasReports,
  selectedReportIds,
  allVisibleReportsSelected,
  onToggleReport,
  onToggleVisibleReports,
  onOpenReport,
}: ReportsTableProps) => {
  const { t } = useTranslation();

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
            <TableHeaderCell>{t('Subject')}</TableHeaderCell>
            <TableHeaderCell>{t('Date')}</TableHeaderCell>
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
              <TableCell className="flex gap-2 items-center">
                <ReportOutcomeIcon outcome={report.outcome} />
                <Link
                  onClick={() => onOpenReport(report)}
                  to={`../reports/${report.id}`}
                >
                  <Text
                    className={
                      report.tags.includes('read')
                        ? 'text-gray-700 font-normal'
                        : 'text-link font-medium'
                    }
                  >
                    {getReportSubject(report)}
                  </Text>
                </Link>
                {report.tags.includes('archived') && <Icon type="hero" />}
              </TableCell>
              <TableCell>
                {new Date(report.timestamp).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
          {!hasReports && (
            <TableRow>
              <TableCell className="text-center py-8">
                {t('No reports found yet.')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
