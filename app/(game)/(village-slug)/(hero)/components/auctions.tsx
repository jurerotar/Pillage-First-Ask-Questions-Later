import { useTranslation } from 'react-i18next';
import { Text } from 'app/components/text';
import { Section, SectionContent } from 'app/(game)/(village-slug)/components/building-layout';
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
        <Text as="p">
          {t(
            'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusamus animi aperiam consequatur distinctio dolor dolorum, et ex fugiat ipsum labore maiores nam nihil nostrum quibusdam quis sint tempora vel veniam!',
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
