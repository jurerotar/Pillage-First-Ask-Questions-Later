import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getItemDefinition } from '@pillage-first/game-assets/utils/items';
import { formatNumber } from '@pillage-first/utils/format';
import { AuctionFilters } from 'app/(game)/(village-slug)/(hero)/components/auction-filters';
import { useAuctionFilters } from 'app/(game)/(village-slug)/(hero)/components/hooks/use-auction-filters';
import { useHeroAuctionBuyListings } from 'app/(game)/(village-slug)/(hero)/components/hooks/use-hero-auctions';
import { isAuctionItemVisible } from 'app/(game)/(village-slug)/(hero)/components/utils/auction-items';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useHeroInventory } from 'app/(game)/(village-slug)/hooks/use-hero-inventory';
import { usePagination } from 'app/(game)/(village-slug)/hooks/use-pagination';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import { Pagination } from 'app/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';

const silverItemId = 1025;

export const AuctionsBuyItem = () => {
  const { t } = useTranslation();

  const { page, handlePageChange, ...auctionFilters } = useAuctionFilters();
  const { buyListings, buyListing, isBuyingListing } =
    useHeroAuctionBuyListings();
  const { heroInventory } = useHeroInventory();

  const silverAmount =
    heroInventory.find(({ id }) => id === silverItemId)?.amount ?? 0;

  const filteredListings = useMemo(() => {
    return buyListings.filter(({ itemId }) =>
      isAuctionItemVisible(itemId, auctionFilters.auctionFilters),
    );
  }, [buyListings, auctionFilters.auctionFilters]);

  const pagination = usePagination(filteredListings, 20, page);

  return (
    <Section>
      <SectionContent>
        <InformationPopover ariaLabel={t('Buy items')}>
          <Text>
            {t(
              'Browse and bid on hero items using silver. Find equipment or consumables that fit your needs.',
            )}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('Buy items')}</Text>
      </SectionContent>
      <AuctionFilters {...auctionFilters} />
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>{t('Item')}</TableHeaderCell>
              <TableHeaderCell>{t('Amount')}</TableHeaderCell>
              <TableHeaderCell>{t('Price')}</TableHeaderCell>
              <TableHeaderCell>{t('Expires in')}</TableHeaderCell>
              <TableHeaderCell>{t('Action')}</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.currentPageItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground"
                >
                  {t('No auction listings match your filters')}
                </TableCell>
              </TableRow>
            ) : (
              pagination.currentPageItems.map((listing) => {
                const item = getItemDefinition(listing.itemId);
                const canAffordListing = silverAmount >= listing.price;

                return (
                  <TableRow key={listing.id}>
                    <TableCell>{t(`ITEMS.${item.name}.NAME`)}</TableCell>
                    <TableCell>{formatNumber(listing.amount)}</TableCell>
                    <TableCell>{formatNumber(listing.price)}</TableCell>
                    <TableCell>
                      <Countdown endsAt={listing.expiresAt} />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        disabled={!canAffordListing || isBuyingListing}
                        onClick={() => {
                          buyListing(listing.id);
                        }}
                      >
                        {t('Buy')}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex w-full justify-end">
        <Pagination
          {...pagination}
          setPage={handlePageChange}
        />
      </div>
    </Section>
  );
};
