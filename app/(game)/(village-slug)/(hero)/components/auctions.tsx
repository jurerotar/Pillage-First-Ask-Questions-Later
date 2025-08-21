import { useTranslation } from 'react-i18next';
import { Text } from 'app/components/text';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import { AuctionsBuyItem } from 'app/(game)/(village-slug)/(hero)/components/auctions-buy-item';
import { AuctionsSellItem } from 'app/(game)/(village-slug)/(hero)/components/auctions-sell-item';
import { AuctionsTradeHistory } from 'app/(game)/(village-slug)/(hero)/components/auctions-trade-history';

export const Auctions = () => {
  const { t } = useTranslation();

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Auctions')}</Text>
        <Text>
          {t(
            'Auctions are used to buy and sell hero items with silver. They’re a reliable way to obtain useful equipment or consumables when you need them.',
          )}
        </Text>
      </SectionContent>
      <Tabs>
        <TabList>
          <Tab>{t('Buy')}</Tab>
          <Tab>{t('Sell')}</Tab>
          <Tab>{t('History')}</Tab>
        </TabList>
        <TabPanel>
          <AuctionsBuyItem />
        </TabPanel>
        <TabPanel>
          <AuctionsSellItem />
        </TabPanel>
        <TabPanel>
          <AuctionsTradeHistory />
        </TabPanel>
      </Tabs>
    </Section>
  );
};
