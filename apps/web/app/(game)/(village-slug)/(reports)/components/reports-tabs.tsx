import { useTranslation } from 'react-i18next';
import type { ReportType } from '@pillage-first/types/models/report';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import { ReportsList } from './reports-list';

export const reportTabs = ['global', 'unread', 'archived', 'village'] as const;

export type ReportScope = (typeof reportTabs)[number];

type ReportsTabsProps = {
  value: ReportScope;
  onValueChange: (scope: string) => void;
  page: number;
  reportFilters: ReportType[];
  handlePageChange: (newPage: number | ((prev: number) => number)) => void;
};

export const ReportsTabs = ({
  value,
  onValueChange,
  page,
  reportFilters,
  handlePageChange,
}: ReportsTabsProps) => {
  const { t } = useTranslation();
  const tabs: { scope: ReportScope; label: string }[] = [
    { scope: 'global', label: t('All') },
    { scope: 'unread', label: t('Unread') },
    { scope: 'archived', label: t('Archived') },
    { scope: 'village', label: t('This village') },
  ];

  return (
    <Tabs
      value={value}
      onValueChange={onValueChange}
    >
      <TabList>
        {tabs.map(({ scope, label }) => (
          <Tab
            key={scope}
            value={scope}
          >
            {label}
          </Tab>
        ))}
      </TabList>
      {tabs.map(({ scope }) => (
        <TabPanel
          key={scope}
          value={scope}
        >
          <ReportsList
            scope={scope}
            page={page}
            reportFilters={reportFilters}
            handlePageChange={handlePageChange}
          />
        </TabPanel>
      ))}
    </Tabs>
  );
};
