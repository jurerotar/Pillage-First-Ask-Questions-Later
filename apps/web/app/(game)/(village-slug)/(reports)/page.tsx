import { useTranslation } from 'react-i18next';
import type { Route } from '@react-router/types/app/(game)/(village-slug)/(reports)/+types/page';
import { ReportFilters } from 'app/(game)/(village-slug)/(reports)/components/report-filters';
import { ReportsList } from 'app/(game)/(village-slug)/(reports)/components/reports-list';
import { ReportsListHeader } from 'app/(game)/(village-slug)/(reports)/components/reports-list-header';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { PageContents } from 'app/components/page-contents';
import { Text } from 'app/components/text';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import { useFilteredReports } from './hooks/use-filtered-reports';

const ReportsPage = ({ params }: Route.ComponentProps) => {
  const { serverSlug, villageSlug } = params;

  const { t } = useTranslation();
  const {
    scope,
    reports,
    updateReports,
    deleteReports,
    reportFilters,
    onReportFiltersChange,
    page,
    handlePageChange,
    navigateToTab,
  } = useFilteredReports();

  const title = `${t('Reports')} | Pillage First! - ${serverSlug} - ${villageSlug}`;

  return (
    <PageContents>
      <title>{title}</title>
      <InformationPopover
        ariaLabel={t('Reports')}
        className="top-2 right-2"
      >
        <Text>
          {t(
            'Review categorized in-game reports across all villages, archived reports and the current village.',
          )}
        </Text>
      </InformationPopover>

      <Section>
        <SectionContent>
          <Text as="h1">{t('Reports')}</Text>
          <ReportFilters
            reportFilters={reportFilters}
            onChange={onReportFiltersChange}
          />
        </SectionContent>
        <SectionContent>
          <Tabs
            value={scope}
            onValueChange={navigateToTab}
          >
            <TabList>
              <Tab value="global">{t('All')}</Tab>
              <Tab value="unread">{t('Unread')}</Tab>
              <Tab value="archived">{t('Archived')}</Tab>
              <Tab value="village">{t('This village')}</Tab>
            </TabList>
            <TabPanel value={scope}>
              <Section>
                <SectionContent>
                  <ReportsListHeader scope={scope} />
                </SectionContent>
                <SectionContent>
                  <ReportsList
                    reports={reports}
                    page={page}
                    updateReports={updateReports}
                    deleteReports={deleteReports}
                    handlePageChange={handlePageChange}
                  />
                </SectionContent>
              </Section>
            </TabPanel>
          </Tabs>
        </SectionContent>
      </Section>
    </PageContents>
  );
};

export default ReportsPage;
