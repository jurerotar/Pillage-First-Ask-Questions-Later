import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import {
  type BaseReport,
  type ReportTag,
  type ReportType,
  reportBattleResultTags,
} from '@pillage-first/types/models/report';
import type { Route } from '@react-router/types/app/(game)/(village-slug)/(reports)/+types/page';
import { ReportFilters } from 'app/(game)/(village-slug)/(reports)/components/report-filters';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Icon } from 'app/components/icon';
import { PageContents } from 'app/components/page-contents';
import { Text } from 'app/components/text';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
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
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import { usePagination } from '../hooks/use-pagination';
import { useReports } from '../hooks/use-reports';
import { useReportFilters } from './hooks/use-report-filters';

const ReportTagIcon = (tags: ReportTag[]) => {
  const resultTag = tags.find((t) => reportBattleResultTags.includes(t));
  switch (resultTag) {
    case 'ATTACKER_NO_LOSS':
      return <Icon type="attackerNoLoss" />;
    case 'ATTACKER_SOME_LOSS':
      return <Icon type="attackerSomeLoss" />;
    case 'ATTACKER_FULL_LOSS':
      return <Icon type="attackerFullLoss" />;
    case 'DEFENDER_NO_LOSS':
      return <Icon type="defenderNoLoss" />;
    case 'DEFENDER_SOME_LOSS':
      return <Icon type="defenderSomeLoss" />;
    case 'DEFENDER_FULL_LOSS':
      return <Icon type="defenderFullLoss" />;
    default:
      return null;
  }
};

type ReportsListProps = {
  scope: 'village' | 'unread' | 'archived' | 'global';
  page: number;
  reportFilters: ReportType[];
  handlePageChange: (newPage: number | ((prev: number) => number)) => void;
};

export const ReportsList = ({
  scope,
  page,
  reportFilters,
  handlePageChange,
}: ReportsListProps) => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { reports, updateReports, deleteReports } = useReports(
    scope,
    reportFilters,
  );
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
    if (!report.tags.includes('READ')) {
      updateReports({ reportIds: [report.id], addTags: ['READ'] });
    }
  };

  const markSelectedAsRead = () => {
    updateReports({ reportIds: selected, addTags: ['READ'] });
    setSelected([]);
  };

  const markSelectedAsUnread = () => {
    updateReports({ reportIds: selected, removeTags: ['READ'] });
    setSelected([]);
  };

  const markSelectedAsArchived = () => {
    updateReports({ reportIds: selected, addTags: ['ARCHIVED'] });
    setSelected([]);
  };

  const markSelectedAsUnarchived = () => {
    updateReports({ reportIds: selected, removeTags: ['ARCHIVED'] });
    setSelected([]);
  };

  const deleteSelected = () => {
    deleteReports({ reportIds: selected });
    setSelected([]);
  };

  const title =
    scope === 'global'
      ? t('All reports')
      : scope === 'unread'
        ? t('Unread reports')
        : scope === 'archived'
          ? t('Archived reports')
          : t('Reports in {{villageName}}', {
              villageName: currentVillage.name,
            });

  const description =
    scope === 'global'
      ? t(
          'This is a categorized view of in-game reports. You can toggle different types of reports by using report filters above.',
        )
      : scope === 'unread'
        ? t(
            'This is a categorized view of unread reports. You can toggle different types of reports by using report filters above.',
          )
        : scope === 'archived'
          ? t(
              'This is a categorized view of archived reports. These reports are not deleted once a limit is reached and you can have an unlimited amount of them. You can toggle different types of reports by using report filters above.',
            )
          : t(
              'This is a categorized view of in-game reports from {{villageName}}. You can toggle different types of reports by using report filters above.',
              {
                villageName: currentVillage.name,
              },
            );

  return (
    <Section>
      <SectionContent>
        <InformationPopover ariaLabel={title}>
          <Text>{description}</Text>
        </InformationPopover>
        <Text as="h2">{title}</Text>
      </SectionContent>
      <div className="overflow-x-scroll scrollbar-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>
                <Checkbox
                  checked={
                    selected.length > 0 &&
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
                  {ReportTagIcon(report.tags)}
                  <Link
                    onClick={() => markAsRead(report)}
                    to={`../reports/${report.id}`}
                  >
                    <Text
                      className={
                        report.tags.includes('READ')
                          ? 'text-gray-700 font-normal'
                          : 'text-link font-medium'
                      }
                    >
                      {report.subject}
                    </Text>
                  </Link>
                  {report.tags.includes('ARCHIVED') && <Icon type="hero" />}
                </TableCell>
                <TableCell>
                  {new Date(report.timestamp).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
            {reports.length === 0 && (
              <TableRow>
                <TableCell className="text-center py-8">
                  {t('No reports found yet.')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex w-full justify-between">
        <div className="flex gap-3 flex-wrap">
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
            {t('Read')}
          </Button>
          {scope !== 'unread' && (
            <Button
              disabled={selected.length === 0}
              onClick={markSelectedAsUnread}
            >
              {t('Unread')}
            </Button>
          )}

          {scope !== 'archived' && (
            <Button
              disabled={selected.length === 0}
              onClick={markSelectedAsArchived}
            >
              {t('Archive')}
            </Button>
          )}
          <Button
            disabled={selected.length === 0}
            onClick={markSelectedAsUnarchived}
          >
            {t('Unarchive')}
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

const tabs = ['global', 'unread', 'archived', 'village'];

const ReportsPage = ({ params }: Route.ComponentProps) => {
  const { serverSlug, villageSlug } = params;

  const { t } = useTranslation();
  const { tabIndex, navigateToTab } = useTabParam(tabs, 'reports-tab');
  const {
    filters: reportFilters,
    onFiltersChange: onReportFiltersChange,
    page,
    handlePageChange,
  } = useReportFilters();

  const title = `${t('Reports')} | Pillage First! - ${serverSlug} - ${villageSlug}`;

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
            value={tabs[tabIndex]}
            onValueChange={(value) => navigateToTab(value)}
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
