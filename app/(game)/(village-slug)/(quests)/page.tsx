import { useTranslation } from 'react-i18next';
import type { Route } from '@react-router/types/app/(game)/(village-slug)/(quests)/+types/page';
import { QuestList } from 'app/(game)/(village-slug)/(quests)/components/quest-list';
import { SectionContent } from 'app/(game)/(village-slug)/components/building-layout';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { useQuests } from 'app/(game)/(village-slug)/hooks/use-quests';
import { Text } from 'app/components/text';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import type { Quest } from 'app/interfaces/models/game/quest';
import { partition } from 'app/utils/common';

const QuestsPage = ({ params }: Route.ComponentProps) => {
  const { serverSlug, villageSlug } = params;

  const { currentVillage } = useCurrentVillage();
  const { t } = useTranslation();
  const { quests } = useQuests();

  const tabs = ['default', 'global'];

  const { tabIndex, navigateToTab } = useTabParam(tabs);

  const [villageQuests, globalQuests] = partition<Quest>(
    quests,
    (quest) => quest.scope === 'village',
  );

  const title = `${t('Quests')} | Pillage First! - ${serverSlug} - ${villageSlug}`;

  return (
    <>
      <title>{title}</title>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="../resources">{t('Resources')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>{t('Quests')}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Text as="h1">{t('Quests')}</Text>
      <Text>
        {t(
          'This is a categorized overview of available quests. Quests are divided into village-specific and global tasks, each with multiple levels to complete. Rewards vary from resources, hero experience, troops and hero items. Reward is added immediately on collection.',
        )}
      </Text>
      <Tabs
        value={tabs[tabIndex] ?? tabs[0]}
        onValueChange={(value) => {
          navigateToTab(value);
        }}
      >
        <TabList>
          <Tab value="default">{t('Village')}</Tab>
          <Tab value="global">{t('Global')}</Tab>
        </TabList>
        <TabPanel value="default">
          <SectionContent>
            <Text as="h2">
              {t('Quests for village "{{villageName}}"', {
                villageName: currentVillage.name,
              })}
            </Text>
            <Text>
              {t(
                'These quests are tied to the current village and can only be progressed in current village.',
              )}
            </Text>
            <QuestList quests={villageQuests} />
          </SectionContent>
        </TabPanel>
        <TabPanel value="global">
          <SectionContent>
            <Text as="h2">{t('Global quests')}</Text>
            <Text>
              {t(
                'These quests are not tied to any village and are progress in all villages.',
              )}
            </Text>
            <QuestList quests={globalQuests} />
          </SectionContent>
        </TabPanel>
      </Tabs>
    </>
  );
};

export default QuestsPage;
