import { useQuests } from 'app/(game)/(village-slug)/hooks/use-quests';
import { useTranslation } from 'react-i18next';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { Text } from 'app/components/text';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import { QuestList } from 'app/(game)/(village-slug)/(quests)/components/quest-list';
import { partition } from 'app/utils/common';
import type { Quest } from 'app/interfaces/models/game/quest';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import type { MetaFunction } from 'react-router';
import { t } from 'i18next';
import { SectionContent } from 'app/(game)/(village-slug)/components/building-layout';

export const meta: MetaFunction = ({ params }) => {
  const { serverSlug, villageSlug } = params;

  return [
    {
      title: `${t('Quests')} | Pillage First! - ${serverSlug} - ${villageSlug}`,
    },
  ];
};

const QuestsPage = () => {
  const { currentVillage } = useCurrentVillage();
  const { t } = useTranslation();
  const { quests } = useQuests();
  const { resourcesPath } = useGameNavigation();

  const tabs = ['default', 'global'];

  const { tabIndex, navigateToTab } = useTabParam(tabs);

  const [villageQuests, globalQuests] = partition<Quest>(
    quests,
    (quest) => quest.scope === 'village',
  );

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to={resourcesPath}>{t('Resources')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>{t('Quests')}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Text as="h1">{t('Quests')}</Text>
      <Text as="p">
        {t(
          'This is a categorized overview of available quests. Quests are divided into village-specific and global tasks, each with multiple levels to complete. Rewards vary from resources, hero experience, troops and hero items. Reward is added immediately on collection.',
        )}
      </Text>
      <Tabs
        selectedIndex={tabIndex}
        onSelect={(index) => {
          navigateToTab(tabs[index]);
        }}
      >
        <TabList>
          <Tab>{t('Village')}</Tab>
          <Tab>{t('Global')}</Tab>
        </TabList>
        <TabPanel>
          <SectionContent>
            <Text as="h2">
              {t('Quests for village {{villageName}}', {
                villageName: currentVillage.name,
              })}
            </Text>
            <Text as="p">
              {t(
                'These quests are tied to the current village and can only be progressed in current village.',
              )}
            </Text>
            <QuestList quests={villageQuests} />
          </SectionContent>
        </TabPanel>
        <TabPanel>
          <SectionContent>
            <Text as="h2">{t('Global quests')}</Text>
            <Text as="p">
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
