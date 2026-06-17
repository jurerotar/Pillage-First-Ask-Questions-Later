import { useTranslation } from 'react-i18next';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Text } from 'app/components/text';
import { SendResourcesForm } from './components/send-resources-form';

export const MarketplaceSendResources = () => {
  const { t } = useTranslation();

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="trade" />
        <Text as="h2">{t('Send resources')}</Text>
        <Text>{t('Transfer resources between your villages.')}</Text>
      </SectionContent>
      <SectionContent>
        <SendResourcesForm />
      </SectionContent>
    </Section>
  );
};
