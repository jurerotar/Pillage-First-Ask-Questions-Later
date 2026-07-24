import { useTranslation } from 'react-i18next';
import type { Route } from '@react-router/types/app/(game)/(village-slug)/(reports)/+types/page';
import { ReportFilters } from 'app/(game)/(village-slug)/(reports)/components/report-filters';
import { ReportsList } from 'app/(game)/(village-slug)/(reports)/components/reports-list';
import { ReportsListHeader } from 'app/(game)/(village-slug)/(reports)/components/reports-list-header';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { PageContents } from 'app/components/page-contents';
import { Text } from 'app/components/text';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import { useReportFilters } from './hooks/use-report-filters';

const reportTabs = ['global', 'unread', 'archived', 'village'] as const;

const ReportsPage = ({ params }: Route.ComponentProps) => {
  const { serverSlug, villageSlug } = params;

  const { t } = useTranslation();
  const { tabIndex, navigateToTab } = useTabParam(reportTabs, 'reports-tab');
  const {
    filters: reportFilters,
    onFiltersChange: onReportFiltersChange,
    page,
    handlePageChange,
  } = useReportFilters();

  const title = `${t('Reports')} | Pillage First! - ${serverSlug} - ${villageSlug}`;

  const selectedTab = reportTabs[tabIndex] ?? reportTabs[0];

  return (
    <PageContents>
      <title>{title}</title>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="../village">{t('Village')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>{t('Reports')}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
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
            value={selectedTab}
            onValueChange={navigateToTab}
          >
            <TabList>
              <Tab value="global">{t('All')}</Tab>
              <Tab value="unread">{t('Unread')}</Tab>
              <Tab value="archived">{t('Archived')}</Tab>
              <Tab value="village">{t('This village')}</Tab>
            </TabList>
            <TabPanel value="global">
              <Section>
                <SectionContent>
                  <ReportsListHeader scope="global" />
                </SectionContent>
                <SectionContent>
                  <ReportsList
                    scope="global"
                    page={page}
                    reportFilters={reportFilters}
                    handlePageChange={handlePageChange}
                  />
                </SectionContent>
              </Section>
            </TabPanel>
            <TabPanel value="unread">
              <Section>
                <SectionContent>
                  <ReportsListHeader scope="unread" />
                </SectionContent>
                <SectionContent>
                  <ReportsList
                    scope="unread"
                    page={page}
                    reportFilters={reportFilters}
                    handlePageChange={handlePageChange}
                  />
                </SectionContent>
              </Section>
            </TabPanel>
            <TabPanel value="archived">
              <Section>
                <SectionContent>
                  <ReportsListHeader scope="archived" />
                </SectionContent>
                <SectionContent>
                  <ReportsList
                    scope="archived"
                    page={page}
                    reportFilters={reportFilters}
                    handlePageChange={handlePageChange}
                  />
                </SectionContent>
              </Section>
            </TabPanel>
            <TabPanel value="village">
              <Section>
                <SectionContent>
                  <ReportsListHeader scope="village" />
                </SectionContent>
                <SectionContent>
                  <ReportsList
                    scope="village"
                    page={page}
                    reportFilters={reportFilters}
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
