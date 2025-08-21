import { useTranslation } from 'react-i18next';
import { Alert } from 'app/components/ui/alert';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import { Text } from 'app/components/text';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';

export const BreweryCelebration = () => {
  const { t } = useTranslation();

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="celebration" />
        <Text as="h2">{t('Celebration')}</Text>
        <Text>
          {t(
            'Tasty mead is brewed in the brewery and later quaffed by the soldiers during their celebrations. These drinks make your soldiers braver and stronger when attacking others. Different brews served cause different effects on your troops.',
          )}
        </Text>
      </SectionContent>
      <SectionContent>
        <Tabs>
          <TabList>
            <Tab>{t('Brew of war')}</Tab>
            <Tab>{t('Brew of siege')}</Tab>
            <Tab>{t('Brew of conquer')}</Tab>
          </TabList>
          <TabPanel>
            <SectionContent>
              <Text as="h2">{t('Brew of war')}</Text>
              <Text>
                {t(
                  'A potent blend brewed for berserk fury. Your warriors march with unmatched aggression, gaining +20% attack power. But in their drunken rage, catapult no longer aim accurately and chiefs lose 50% of their persuasive edge',
                )}
              </Text>
              <Text className="font-medium">{t('Effects')}:</Text>
              <ul className="list-disc pl-4">
                <li>
                  <Text>{t('20% attack bonus')}</Text>
                </li>
                <li>
                  <Text>{t('Catapult may only target random buildings')}</Text>
                </li>
                <li>
                  <Text>{t('Chiefs effectiveness reduced by 50%')}</Text>
                </li>
              </ul>
            </SectionContent>
          </TabPanel>
          <TabPanel>
            <SectionContent>
              <Text as="h2">{t('Brew of siege')}</Text>
              <Text>
                {t(
                  'A strong ale that stirs courage without clouding aim. Your armies gain a solid +10% attack, while siege weapons remain steady. Chiefs, however, still stumble over their words, reducing their effectiveness by 50%.',
                )}
              </Text>
              <Text className="font-medium">{t('Effects')}:</Text>
              <ul className="list-disc pl-4">
                <li>
                  <Text>{t('10% attack bonus')}</Text>
                </li>
                <li>
                  <Text>
                    {t('Catapult retain ability to target specific buildings')}
                  </Text>
                </li>
                <li>
                  <Text>{t('Chiefs effectiveness reduced by 50%')}</Text>
                </li>
              </ul>
            </SectionContent>
          </TabPanel>
          <TabPanel>
            <SectionContent>
              <Text as="h2">{t('Brew of conquer')}</Text>
              <Text>
                {t(
                  'A refined brew favored by chieftains. Grants a modest +5% attack boost, sharpens tongues for loyalty speeches, but leaves catapult operators too cheerful to aim straight.',
                )}
              </Text>
              <Text className="font-medium">{t('Effects')}:</Text>
              <ul className="list-disc pl-4">
                <li>
                  <Text>{t('5% attack bonus')}</Text>
                </li>
                <li>
                  <Text>{t('Catapult may only target random buildings')}</Text>
                </li>
                <li>
                  <Text>{t('Chiefs retain full effectiveness')}</Text>
                </li>
              </ul>
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
