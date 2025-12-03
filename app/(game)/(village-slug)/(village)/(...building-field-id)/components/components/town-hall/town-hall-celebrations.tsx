import { useTranslation } from 'react-i18next';
import { Alert } from 'app/components/ui/alert';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import { Text } from 'app/components/text';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';

export const TownHallCelebrations = () => {
  const { t } = useTranslation();

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="celebrations" />
        <Text as="h2">{t('Celebrations')}</Text>
        <Text>
          {t(
            'The Town Hall allows you to hold celebrations, which instantly grant Culture Points. Upgrading the Town Hall reduces the cooldown time between celebrations, allowing you to generate Culture Points more frequently.',
          )}
        </Text>
        <Text as="h2">{t('Types of Celebrations')}</Text>
        <Text className="font-medium">{t('Small Celebration')}:</Text>
        <ul className="list-disc pl-4">
          <li>
            <Text>{t('Gives CP immediately.')}</Text>
          </li>
          <li>
            <Text>
              {t(
                'CP gained equals the daily CP production of the village, up to the celebration limit.',
              )}
            </Text>
          </li>
        </ul>
        <Text className="font-medium">{t('Large Celebration')}:</Text>
        <ul className="list-disc pl-4">
          <li>
            <Text>{t('Gives CP immediately.')}</Text>
          </li>
          <li>
            <Text>
              {t(
                'CP gained equals the daily CP production of all your villages, up to the limit.',
              )}
            </Text>
          </li>
          <li>
            <Text>{t('During a Large Celebration:')}</Text>
            <ul>
              <li>
                <Text>
                  {t(
                    'Your administrators reduce enemy village loyalty by up to 5% more.',
                  )}
                </Text>
              </li>
              <li>
                <Text>
                  {t(
                    'Your own villages lose up to 5% less loyalty when you are attacked.',
                  )}
                </Text>
              </li>
            </ul>
          </li>
        </ul>
        <Text>
          {t(
            'These loyalty effects apply to all battles that take place during the celebration, regardless of when troops were sent.',
          )}
        </Text>
        <Text as="h2">{t('Celebration Limits')}</Text>
        <Text>
          {t(
            'Each celebration type has a maximum number of CP it can generate.',
          )}
        </Text>
        <Text>
          {t(
            'The limit depends on gameworld speed and can be found in the Culture Points table of the game versions overview.',
          )}
        </Text>
        <Text>
          {t(
            'Even if a village in the grey area produces 0 CP, its theoretical CP production still counts toward celebration rewards.',
          )}
        </Text>
        <Text as="h2">{t('Destroyed Town Hall')}</Text>
        <Text>{t('If your Town Hall is destroyed:')}</Text>
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
        <Text as="h2">{t('Celebration Duration')}</Text>
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
        <Tabs>
          <TabList>
            <Tab>{t('Small Celebration')}</Tab>
            <Tab>{t('Large Celebration')}</Tab>
          </TabList>
          <TabPanel>
            <SectionContent>
              <Text as="h2">{t('Small Celebration')}</Text>
            </SectionContent>
          </TabPanel>
          <TabPanel>
            <SectionContent>
              <Text as="h2">{t('Large Celebration')}</Text>
            </SectionContent>
          </TabPanel>
        </Tabs>
        <Alert variant="warning">
          {t('This page is still under development')}
        </Alert>
      </SectionContent>
    </Section>
  );
};
