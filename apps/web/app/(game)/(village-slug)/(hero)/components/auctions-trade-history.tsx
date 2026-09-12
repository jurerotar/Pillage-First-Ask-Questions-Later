import { useTranslation } from 'react-i18next';
import { getItemDefinition } from '@pillage-first/game-assets/utils/items';
import { formatNumber } from '@pillage-first/utils/format';
import { useHeroAuctionHistory } from 'app/(game)/(village-slug)/(hero)/components/hooks/use-hero-auction-history';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { usePagination } from 'app/(game)/(village-slug)/hooks/use-pagination';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Text } from 'app/components/text';
import { Pagination } from 'app/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';
import { useIntl } from 'app/hooks/use-intl';

export const AuctionsTradeHistory = () => {
  const { t } = useTranslation();
  const intl = useIntl();
  const { auctionHistory } = useHeroAuctionHistory();
  const pagination = usePagination(auctionHistory, 20);

  return (
    <Section>
      <SectionContent>
        <InformationPopover ariaLabel={t('Trade history')}>
          <Text>
            {t(
              "Review your recent auctions — see what you've bought, sold, and how much silver was exchanged.",
            )}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('Trade history')}</Text>
      </SectionContent>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>{t('Type')}</TableHeaderCell>
              <TableHeaderCell>{t('Item')}</TableHeaderCell>
              <TableHeaderCell>{t('Amount')}</TableHeaderCell>
              <TableHeaderCell>{t('Price')}</TableHeaderCell>
              <TableHeaderCell>{t('Completed at')}</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.currentPageItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground"
                >
                  {t('No auction trades completed yet')}
                </TableCell>
              </TableRow>
            ) : (
              pagination.currentPageItems.map((historyEntry) => {
                const item = getItemDefinition(historyEntry.itemId);

                return (
                  <TableRow key={historyEntry.id}>
                    <TableCell>
                      {historyEntry.type === 'buy' ? t('Buy') : t('Sell')}
                    </TableCell>
                    <TableCell>{t(`ITEMS.${item.name}.NAME`)}</TableCell>
                    <TableCell>{formatNumber(historyEntry.amount)}</TableCell>
                    <TableCell>{formatNumber(historyEntry.price)}</TableCell>
                    <TableCell>
                      {intl.dateTime.format(new Date(historyEntry.completedAt))}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex w-full justify-end">
        <Pagination {...pagination} />
      </div>
    </Section>
  );
};
