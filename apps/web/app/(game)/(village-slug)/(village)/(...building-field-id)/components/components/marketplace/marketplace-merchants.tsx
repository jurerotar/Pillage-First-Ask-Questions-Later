import { useTranslation } from 'react-i18next';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Text } from 'app/components/text';

export const MarketplaceMerchants = () => {
  const { t } = useTranslation();

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="merchants" />
        <Text as="h2">{t('Merchant overview')}</Text>
      </SectionContent>
      <SectionContent />
    </Section>
  );
};
