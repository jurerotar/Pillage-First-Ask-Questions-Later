import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { partition } from '@pillage-first/utils/array';
import type { Route } from '@react-router/types/app/(game)/(village-slug)/(quests)/+types/page';
import { QuestList } from 'app/(game)/(village-slug)/(quests)/components/quest-list';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { useQuests } from 'app/(game)/(village-slug)/hooks/use-quests';
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

const tabs = ['default', 'global'];

const QuestsPage = ({ params }: Route.ComponentProps) => {
  const { serverSlug, villageSlug } = params;

  const { currentVillage } = useCurrentVillage();
  const { t } = useTranslation();
  const { quests } = useQuests();

  const { tabIndex, navigateToTab } = useTabParam(tabs);

  const [villageQuests, globalQuests] = useMemo(() => {
    return partition(quests, (quest) => quest.scope === 'village');
  }, [quests]);

  const title = `${t('Quests')} | Pillage First! - ${serverSlug} - ${villageSlug}`;

  return (
    <PageContents>
      <title>{title}</title>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="../village">{t('Village')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>{t('Quests')}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <InformationPopover
        ariaLabel={t('Quests')}
        className="top-2 right-2"
      >
        <Text>
          {t(
            'This is a categorized overview of available quests. Quests are divided into village-specific and global tasks, each with multiple levels to complete. Rewards vary from resources, hero experience, troops and hero items. Reward is added immediately on collection.',
          )}
        </Text>
      </InformationPopover>
      <Text as="h1">{t('Quests')}</Text>
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
          <Section>
            <SectionContent>
              <InformationPopover
                ariaLabel={t('Quests for village "{{villageName}}"', {
                  villageName: currentVillage.name,
                })}
              >
                <Text>
                  {t(
                    'These quests are tied to the current village and can only be progressed in current village.',
                  )}
                </Text>
              </InformationPopover>
              <Text as="h2">
                {t('Quests for village "{{villageName}}"', {
                  villageName: currentVillage.name,
                })}
              </Text>
            </SectionContent>
            <SectionContent>
              <QuestList quests={villageQuests} />
            </SectionContent>
          </Section>
        </TabPanel>
        <TabPanel value="global">
          <Section>
            <SectionContent>
              <InformationPopover ariaLabel={t('Global quests')}>
                <Text>
                  {t(
                    'These quests are not tied to any village and are progress in all villages.',
                  )}
                </Text>
              </InformationPopover>
              <Text as="h2">{t('Global quests')}</Text>
            </SectionContent>
            <SectionContent>
              <QuestList quests={globalQuests} />
            </SectionContent>
          </Section>
        </TabPanel>
      </Tabs>
    </PageContents>
  );
};

export default QuestsPage;
