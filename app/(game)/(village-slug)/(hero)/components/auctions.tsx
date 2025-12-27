import { useTranslation } from 'react-i18next';
import { AuctionsBuyItem } from 'app/(game)/(village-slug)/(hero)/components/auctions-buy-item';
import { AuctionsSellItem } from 'app/(game)/(village-slug)/(hero)/components/auctions-sell-item';
import { AuctionsTradeHistory } from 'app/(game)/(village-slug)/(hero)/components/auctions-trade-history';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Text } from 'app/components/text';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';

export const Auctions = () => {
  const { t } = useTranslation();

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Auctions')}</Text>
        <Text>
          {t(
            "Auctions are used to buy and sell hero items with silver. They're a reliable way to obtain useful equipment or consumables when you need them.",
          )}
        </Text>
      </SectionContent>
      <Tabs defaultValue="buy">
        <TabList>
          <Tab value="buy">{t('Buy')}</Tab>
          <Tab value="sell">{t('Sell')}</Tab>
          <Tab value="history">{t('History')}</Tab>
        </TabList>
        <TabPanel value="buy">
          <AuctionsBuyItem />
        </TabPanel>
        <TabPanel value="sell">
          <AuctionsSellItem />
        </TabPanel>
        <TabPanel value="history">
          <AuctionsTradeHistory />
        </TabPanel>
      </Tabs>
    </Section>
  );
};
