import { Text } from 'app/components/text';
import { useTranslation } from 'react-i18next';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import type React from 'react';
import type { Route } from '.react-router/types/app/(game)/(village-slug)/(preferences)/+types/page';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { GeneralPreferences } from 'app/(game)/(village-slug)/(preferences)/components/general-preferences';
import { NotificationPreferences } from 'app/(game)/(village-slug)/(preferences)/components/notification-preferences';

const PreferencesPage: React.FC<Route.ComponentProps> = ({ params }) => {
  const { serverSlug, villageSlug } = params;

  const { t } = useTranslation();
  const { resourcesPath } = useGameNavigation();

  const tabs = ['default', 'notifications'];

  const { tabIndex, navigateToTab } = useTabParam(tabs);

  const title = `${t('Preferences')} | Pillage First! - ${serverSlug} - ${villageSlug}`;

  return (
    <>
      <title>{title}</title>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to={resourcesPath}>{t('Resources')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>{t('Preferences')}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Text as="h1">{t('Preferences')}</Text>
      <Tabs
        selectedIndex={tabIndex}
        onSelect={(index) => {
          navigateToTab(tabs[index]);
        }}
      >
        <TabList>
          <Tab>{t('General')}</Tab>
          <Tab>{t('Notifications')}</Tab>
        </TabList>
        <TabPanel>
          <GeneralPreferences />
        </TabPanel>
        <TabPanel>
          <NotificationPreferences />
        </TabPanel>
      </Tabs>
    </>
  );
};

export default PreferencesPage;
