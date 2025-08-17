import { Alert } from 'app/components/ui/alert';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/components/text';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';

export const AuctionsSellItem = () => {
  const { t } = useTranslation();

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Sell items')}</Text>
        <Text>
          {t(
            'List your hero items for others to bid on. Turn unused gear or consumables into silver.',
          )}
        </Text>
      </SectionContent>
      <Alert variant="warning">
        {t('This page is still under development')}
      </Alert>
    </Section>
  );
};
