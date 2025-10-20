import { Alert } from 'app/components/ui/alert';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/components/text';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { usePagination } from 'app/(game)/(village-slug)/hooks/use-pagination';
import { Pagination } from 'app/components/ui/pagination';
import { useAuctionFilters } from 'app/(game)/(village-slug)/(hero)/components/hooks/use-auction-filters';
import { AuctionFilters } from 'app/(game)/(village-slug)/(hero)/components/auction-filters';

export const AuctionsSellItem = () => {
  const { t } = useTranslation();
  const auctionFilters = useAuctionFilters();
  const pagination = usePagination([], 20);

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
      <AuctionFilters {...auctionFilters} />
      <Alert variant="warning">
        {t('This page is still under development')}
      </Alert>
      <div className="flex w-full justify-end">
        <Pagination {...pagination} />
      </div>
    </Section>
  );
};
