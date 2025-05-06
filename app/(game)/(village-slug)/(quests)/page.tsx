import { useQuests } from 'app/(game)/(village-slug)/hooks/use-quests';
import { useTranslation } from 'react-i18next';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from 'app/components/ui/breadcrumb';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { Text } from 'app/components/text';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import { QuestList } from 'app/(game)/(village-slug)/(quests)/components/quest-list';
import { partition } from 'app/utils/common';
import type { Quest } from 'app/interfaces/models/game/quest';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';

const QuestsPage = () => {
  const { currentVillage } = useCurrentVillage();
  const { t } = useTranslation();
  const { quests } = useQuests();
  const { resourcesPath } = useGameNavigation();

  const tabs = ['default', 'global'];

  const { tabIndex, navigateToTab } = useTabParam(tabs);

  const [villageQuests, globalQuests] = partition<Quest>(quests, (quest) => quest.scope === 'village');

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
          <article className="flex flex-col gap-2">
            <Text as="h2">{t('{{villageName}} quests', { villageName: currentVillage.name })}</Text>
            <QuestList quests={villageQuests} />
          </article>
        </TabPanel>
        <TabPanel>
          <article className="flex flex-col gap-2">
            <Text as="h2">{t('Quests')}</Text>
            <QuestList quests={globalQuests} />
          </article>
        </TabPanel>
      </Tabs>
    </>
  );
};

export default QuestsPage;
