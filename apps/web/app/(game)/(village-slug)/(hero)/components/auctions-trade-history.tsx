import { useTranslation } from 'react-i18next';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { usePagination } from 'app/(game)/(village-slug)/hooks/use-pagination';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Text } from 'app/components/text';
import { Alert } from 'app/components/ui/alert';
import { Pagination } from 'app/components/ui/pagination';

export const AuctionsTradeHistory = () => {
  const { t } = useTranslation();
  const pagination = usePagination([], 20);

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
      <Alert variant="warning">
        {t('This page is still under development')}
      </Alert>
      <div className="flex w-full justify-end">
        <Pagination {...pagination} />
      </div>
    </Section>
  );
};
