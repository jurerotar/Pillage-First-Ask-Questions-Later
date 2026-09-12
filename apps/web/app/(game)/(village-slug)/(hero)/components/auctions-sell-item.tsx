import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getItemDefinition } from '@pillage-first/game-assets/utils/items';
import { formatNumber } from '@pillage-first/utils/format';
import { AuctionFilters } from 'app/(game)/(village-slug)/(hero)/components/auction-filters';
import { useAuctionFilters } from 'app/(game)/(village-slug)/(hero)/components/hooks/use-auction-filters';
import { useHeroAuctionSellListings } from 'app/(game)/(village-slug)/(hero)/components/hooks/use-hero-auctions';
import {
  isAuctionItemVisible,
  isAuctionSellableItem,
} from 'app/(game)/(village-slug)/(hero)/components/utils/auction-items';
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
import { Input } from 'app/components/ui/input';
import { Pagination } from 'app/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';

export const AuctionsSellItem = () => {
  const { t } = useTranslation();
  const { page, handlePageChange, ...auctionFilters } = useAuctionFilters();
  const { heroInventory } = useHeroInventory();
  const { sellListings, sellItem, isSellingItem } =
    useHeroAuctionSellListings();
  const [sellAmounts, setSellAmounts] = useState<Record<number, number>>({});

  const filteredInventory = useMemo(() => {
    return heroInventory.filter(({ id }) => {
      return (
        isAuctionSellableItem(id) &&
        isAuctionItemVisible(id, auctionFilters.auctionFilters)
      );
    });
  }, [heroInventory, auctionFilters.auctionFilters]);

  const pagination = usePagination(filteredInventory, 20, page);

  return (
    <Section>
      <SectionContent>
        <InformationPopover ariaLabel={t('Sell items')}>
          <Text>
            {t(
              'List your hero items for others to bid on. Turn unused gear or consumables into silver.',
            )}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('Sell items')}</Text>
      </SectionContent>
      <AuctionFilters {...auctionFilters} />
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>{t('Item')}</TableHeaderCell>
              <TableHeaderCell>{t('Available')}</TableHeaderCell>
              <TableHeaderCell>{t('Sell amount')}</TableHeaderCell>
              <TableHeaderCell>{t('Estimated price')}</TableHeaderCell>
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
                  {t('No inventory items match your filters')}
                </TableCell>
              </TableRow>
            ) : (
              pagination.currentPageItems.map((inventoryItem) => {
                const item = getItemDefinition(inventoryItem.id);
                const amount = Math.min(
                  inventoryItem.amount,
                  sellAmounts[inventoryItem.id] ?? 1,
                );
                const minimumPrice = Math.max(
                  1,
                  Math.round(item.basePrice! * amount * 0.18),
                );
                const maximumPrice = Math.max(
                  1,
                  Math.round(item.basePrice! * amount * 0.22),
                );

                return (
                  <TableRow key={inventoryItem.id}>
                    <TableCell>{t(`ITEMS.${item.name}.NAME`)}</TableCell>
                    <TableCell>{formatNumber(inventoryItem.amount)}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        max={inventoryItem.amount}
                        value={amount}
                        className="w-24"
                        hideSpinner
                        onChange={(event) => {
                          const nextAmount = Math.min(
                            inventoryItem.amount,
                            Math.max(1, Number(event.currentTarget.value)),
                          );

                          setSellAmounts((previousAmounts) => ({
                            ...previousAmounts,
                            [inventoryItem.id]: nextAmount,
                          }));
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {formatNumber(minimumPrice)}-{formatNumber(maximumPrice)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        disabled={isSellingItem}
                        onClick={() => {
                          sellItem({
                            itemId: inventoryItem.id,
                            amount,
                          });
                        }}
                      >
                        {t('Sell')}
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
      <SectionContent>
        <Text as="h3">{t('Pending sales')}</Text>
      </SectionContent>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>{t('Item')}</TableHeaderCell>
              <TableHeaderCell>{t('Amount')}</TableHeaderCell>
              <TableHeaderCell>{t('Price')}</TableHeaderCell>
              <TableHeaderCell>{t('Sells in')}</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sellListings.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-muted-foreground"
                >
                  {t('No items are currently being sold')}
                </TableCell>
              </TableRow>
            ) : (
              sellListings.map((listing) => {
                const item = getItemDefinition(listing.itemId);

                return (
                  <TableRow key={listing.id}>
                    <TableCell>{t(`ITEMS.${item.name}.NAME`)}</TableCell>
                    <TableCell>{formatNumber(listing.amount)}</TableCell>
                    <TableCell>{formatNumber(listing.price)}</TableCell>
                    <TableCell>
                      <Countdown endsAt={listing.sellsAt} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Section>
  );
};
