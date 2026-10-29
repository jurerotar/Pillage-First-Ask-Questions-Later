import { useTranslation } from 'react-i18next';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-tabs/bookmark';
import { CelebrationCard } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-tabs/town-hall/celebration-card';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Text } from 'app/components/text';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';

const tabs = ['small-celebration', 'large-celebration'];

export const TownHallCelebrations = () => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { tabIndex, navigateToTab } = useTabParam(
    tabs,
    'town-hall-celebrations-tab',
  );

  const townHallLevel = Math.max(
    ...currentVillage.buildingFields
      .filter(({ buildingId }) => buildingId === 'TOWN_HALL')
      .map(({ level }) => level),
    0,
  );

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="celebrations" />
        <InformationPopover ariaLabel={t('Celebrations')}>
          <Text>
            {t(
              'The Town Hall allows you to hold celebrations, which instantly grant Culture Points. Upgrading the Town Hall reduces the cooldown time between celebrations, allowing you to generate Culture Points more frequently.',
            )}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('Celebrations')}</Text>
        <Text as="h3">{t('Celebration Limits')}</Text>
        <Text>
          {t(
            'Each celebration type has a maximum number of Culture Points it can generate.',
          )}
        </Text>
        <Text>
          {t(
            'The limit depends on gameworld speed and can be found in the Culture Points table of the game versions overview.',
          )}
        </Text>
        <Text as="h3">{t('Destroyed Town Hall')}</Text>
        <ul className="list-disc pl-4">
          <li>
            <Text>{t('Ongoing celebrations continue normally.')}</Text>
          </li>
          <li>
            <Text>
              {t(
                'Queued celebrations continue and will start after cooldown ends.',
              )}
            </Text>
          </li>
          <li>
            <Text>
              {t(
                'You cannot start new celebrations until the Town Hall is rebuilt.',
              )}
            </Text>
          </li>
        </ul>
        <Text as="h3">{t('Celebration Duration')}</Text>
        <Text>
          {t(
            'Each celebration triggers a cooldown before the next one can start.',
          )}
        </Text>
        <Text>
          {t(
            'The exact cooldown duration depends on the Town Hall level and server speed.',
          )}
        </Text>
      </SectionContent>
      <SectionContent>
        <Tabs
          value={tabs[tabIndex] ?? tabs[0]}
          onValueChange={(value) => {
            navigateToTab(value);
          }}
        >
          <TabList>
            <Tab value="small-celebration">{t('Small Celebration')}</Tab>
            <Tab value="large-celebration">{t('Large Celebration')}</Tab>
          </TabList>
          <TabPanel value="small-celebration">
            <CelebrationCard
              celebrationType="small"
              townHallLevel={townHallLevel}
            />
          </TabPanel>
          <TabPanel value="large-celebration">
            <CelebrationCard
              celebrationType="large"
              townHallLevel={townHallLevel}
            />
          </TabPanel>
        </Tabs>
      </SectionContent>
    </Section>
  );
};
