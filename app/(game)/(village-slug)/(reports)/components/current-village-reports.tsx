import { ReportFilters } from 'app/(game)/(village-slug)/(reports)/components/components/report-filters';
import { useReportFilters } from 'app/(game)/(village-slug)/(reports)/components/hooks/use-report-filters';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Text } from 'app/components/text';
import { useTranslation } from 'react-i18next';
import { Alert } from 'app/components/ui/alert';
import { usePagination } from 'app/(game)/(village-slug)/hooks/use-pagination';
import { Pagination } from 'app/components/ui/pagination';

export const CurrentVillageReports = () => {
  const { t } = useTranslation();
  const { reportFilters, onReportFiltersChange } = useReportFilters();

  const pagination = usePagination([], 20);

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Current village reports')}</Text>
        <Text>
          {t(
            'This is a categorized view of in-game reports for current village. You can toggle different types of reports by using report filters below.',
          )}
        </Text>
      </SectionContent>
      <ReportFilters
        reportFilters={reportFilters}
        onChange={onReportFiltersChange}
      />
      <Alert variant="warning">
        {t('This page is still under development')}
      </Alert>
      <div className="flex w-full justify-end">
        <Pagination {...pagination} />
      </div>
    </Section>
  );
};
