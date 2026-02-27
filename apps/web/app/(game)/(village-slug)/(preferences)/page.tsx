import { useTranslation } from 'react-i18next';
import type { Route } from '@react-router/types/app/(game)/(village-slug)/(preferences)/+types/page';
import { GeneralPreferences } from 'app/(game)/(village-slug)/(preferences)/components/general-preferences';
import { NotificationPreferences } from 'app/(game)/(village-slug)/(preferences)/components/notification-preferences';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { Text } from 'app/components/text';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';

const tabs = ['default', 'notifications'];

const PreferencesPage = ({ params }: Route.ComponentProps) => {
  const { serverSlug, villageSlug } = params;

  const { t } = useTranslation();

  const { tabIndex, navigateToTab } = useTabParam(tabs);

  const title = `${t('Preferences')} | Pillage First! - ${serverSlug} - ${villageSlug}`;

  return (
    <>
      <title>{title}</title>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="../village">{t('Village')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>{t('Preferences')}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Text as="h1">{t('Preferences')}</Text>
      <Tabs
        value={tabs[tabIndex] ?? 'default'}
        onValueChange={(value: string) => {
          navigateToTab(value);
        }}
      >
        <TabList>
          <Tab value="default">{t('General')}</Tab>
          <Tab value="notifications">{t('Notifications')}</Tab>
        </TabList>
        <TabPanel value="default">
          <GeneralPreferences />
        </TabPanel>
        <TabPanel value="notifications">
          <NotificationPreferences />
        </TabPanel>
      </Tabs>
    </>
  );
};

export default PreferencesPage;
