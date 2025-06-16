import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { Alert } from 'app/components/ui/alert';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from 'app/components/ui/breadcrumb';
import { Text } from 'app/components/text';
import type { MetaFunction } from 'react-router';
import { t } from 'i18next';
import { useStatistics } from './components/hooks/use-statistics';
import { Section, SectionContent } from '../components/building-layout';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from 'app/components/ui/table';

export const meta: MetaFunction = ({ params }) => {
  const { serverSlug, villageSlug } = params;

  return [
    {
      title: `${t('Statistics')} | Pillage First! - ${serverSlug} - ${villageSlug}`,
    },
  ];
};

const StatisticsPage = () => {
  const { t } = useTranslation();
  const { resourcesPath } = useGameNavigation();

  const tabs = ['default', 'villages', 'week-by-week'];

  const { tabIndex, navigateToTab } = useTabParam(tabs);

  const statistics = useStatistics();

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to={resourcesPath}>{t('Resources')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>{t('Statistics')}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Text as="h1">{t('Statistics')}</Text>
      <Tabs
        selectedIndex={tabIndex}
        onSelect={(index) => {
          navigateToTab(tabs[index]);
        }}
      >
        <TabList>
          <Tab>{t('Overview')}</Tab>
          <Tab>{t('Villages')}</Tab>
          <Tab>{t('Week by week')}</Tab>
        </TabList>
        <TabPanel>
          <Section>
            <SectionContent>
              <Text as="h2">{t('The largest players')}</Text>
              <div className="overflow-x-scroll scrollbar-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>{t('Name')}</TableHeaderCell>
                      <TableHeaderCell>{t('Villages')}</TableHeaderCell>
                      <TableHeaderCell>{t('Population')}</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statistics.map(({ player, villages, population }) => (
                      <TableRow key={player.id}>
                        <TableCell>{player.name}</TableCell>
                        <TableCell>{villages.length}</TableCell>
                        <TableCell>{population}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Alert variant="warning">{t('This page is still under development')}</Alert>
            </SectionContent>
          </Section>
        </TabPanel>
        <TabPanel>
          <Alert variant="warning">{t('This page is still under development')}</Alert>
        </TabPanel>
        <TabPanel>
          <Alert variant="warning">{t('This page is still under development')}</Alert>
        </TabPanel>
      </Tabs>
    </>
  );
};

export default StatisticsPage;
