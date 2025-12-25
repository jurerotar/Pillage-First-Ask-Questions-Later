import { useTranslation } from 'react-i18next';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Text } from 'app/components/text';
import { Alert } from 'app/components/ui/alert';

export const AuctionsTradeHistory = () => {
  const { t } = useTranslation();

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Trade history')}</Text>
        <Text>
          {t(
            "Review your recent auctions — see what you've bought, sold, and how much silver was exchanged.",
          )}
        </Text>
      </SectionContent>
      <Alert variant="warning">
        {t('This page is still under development')}
      </Alert>
    </Section>
  );
};
