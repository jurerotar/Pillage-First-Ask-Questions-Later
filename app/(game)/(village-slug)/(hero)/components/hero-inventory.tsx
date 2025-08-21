import { Alert } from 'app/components/ui/alert';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/components/text';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';

export const HeroInventory = () => {
  const { t } = useTranslation();

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Inventory')}</Text>
        <Text>
          {t(
            "Your hero's equipment will give you advantages that will help you outperform your opponents. You may change your hero’s equipment whenever your hero is not travelling. Items that affect villages or buildings apply to the village the hero is currently assigned to.",
          )}
        </Text>
      </SectionContent>
      <Alert variant="warning">
        {t('This page is still under development')}
      </Alert>
    </Section>
  );
};
