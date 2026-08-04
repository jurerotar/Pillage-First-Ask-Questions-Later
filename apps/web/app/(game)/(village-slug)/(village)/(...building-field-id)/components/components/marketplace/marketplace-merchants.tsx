import { useTranslation } from 'react-i18next';
import { formatNumber } from '@pillage-first/utils/format';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import { useMarketplaceMerchants } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/marketplace/hooks/use-marketplace-merchants';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { MerchantMovementTable } from 'app/(game)/(village-slug)/components/merchant-movement-table';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Text } from 'app/components/text';

export const MarketplaceMerchants = () => {
  const { t } = useTranslation();
  const { marketplaceLevel, availableMerchantAmount, merchant, totalCapacity } =
    useMarketplaceMerchants();

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="merchants" />
        <InformationPopover ariaLabel={t('Merchant overview')}>
          <Text>
            {t(
              'Merchants transport resources between villages. This overview shows how many merchants are free and which merchant movements are in progress.',
            )}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('Merchant overview')}</Text>
      </SectionContent>
      <SectionContent>
        <Text className="font-medium">
          {t('Free merchants')}: {formatNumber(availableMerchantAmount)} /{' '}
          {formatNumber(marketplaceLevel)}
        </Text>
        <Text className="font-medium">
          {t('Capacity per merchant')}:{' '}
          {formatNumber(merchant.merchantCapacity)}
        </Text>
        <Text className="font-medium">
          {t('Total available capacity')}: {formatNumber(totalCapacity)}
        </Text>
      </SectionContent>
      <SectionContent>
        <MerchantMovementTable />
      </SectionContent>
    </Section>
  );
};
