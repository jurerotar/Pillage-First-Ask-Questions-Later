import { ReportFilters } from 'app/(game)/(village-slug)/(reports)/components/components/report-filters';
import { useReportFilters } from 'app/(game)/(village-slug)/(reports)/components/hooks/use-report-filters';
import {
  BuildingSection,
  BuildingSectionContent,
} from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/components/building-layout';
import { Text } from 'app/components/text';
import { useTranslation } from 'react-i18next';
import { useReports } from 'app/(game)/(village-slug)/hooks/use-reports';
import { Alert } from 'app/components/ui/alert';

export const ArchivedReports = () => {
  const { t } = useTranslation();
  const { reportFilters, onReportFiltersChange } = useReportFilters();
  const { reports } = useReports();

  const _reportsToDisplay = reports.filter(({ type }) => {
    return reportFilters.includes(type);
  });

  return (
    <BuildingSection>
      <BuildingSectionContent>
        <Text as="h2">{t('Archived reports')}</Text>
        <Text as="p">
          {t(
            'This is a categorized view of archived reports. These reports are not deleted once a limit is reached and you can have an unlimited amount of them. You can toggle different types of reports by using report filters below.',
          )}
        </Text>
      </BuildingSectionContent>
      <ReportFilters
        reportFilters={reportFilters}
        onChange={onReportFiltersChange}
      />
      <Alert variant="warning">{t('This page is still under development')}</Alert>
    </BuildingSection>
  );
};
