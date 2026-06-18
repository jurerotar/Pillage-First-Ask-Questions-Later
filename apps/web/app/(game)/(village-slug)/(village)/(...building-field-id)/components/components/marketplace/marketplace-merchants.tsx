import { useTranslation } from 'react-i18next';
import { formatNumber } from '@pillage-first/utils/format';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import { useMarketplaceMerchants } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/marketplace/hooks/use-marketplace-merchants';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { MerchantMovementTable } from 'app/(game)/(village-slug)/components/merchant-movement-table';
import { Text } from 'app/components/text';

export const MarketplaceMerchants = () => {
  const { t } = useTranslation();
  const { marketplaceLevel, availableMerchantAmount } =
    useMarketplaceMerchants();

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="merchants" />
        <Text as="h2">{t('Merchant overview')}</Text>
      </SectionContent>
      <SectionContent>
        <Text className="font-medium">
          {t('Free merchants')}: {formatNumber(availableMerchantAmount)} /{' '}
          {formatNumber(marketplaceLevel)}
        </Text>
      </SectionContent>
      <SectionContent>
        <MerchantMovementTable />
      </SectionContent>
    </Section>
  );
};
