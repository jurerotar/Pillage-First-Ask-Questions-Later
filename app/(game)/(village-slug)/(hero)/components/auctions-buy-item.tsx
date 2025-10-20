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

export const AuctionsBuyItem = () => {
  const { t } = useTranslation();

  const pagination = usePagination([], 20);
  const auctionFilters = useAuctionFilters();

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Buy items')}</Text>
        <Text>
          {t(
            'Browse and bid on hero items using silver. Find equipment or consumables that fit your needs.',
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
