import { Alert } from 'app/components/ui/alert';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/components/text';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';

export const HeroInventory = () => {
  const { t } = useTranslation();

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Inventory')}</Text>
        <Text>
          {t(
            'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusamus animi aperiam consequatur distinctio dolor dolorum, et ex fugiat ipsum labore maiores nam nihil nostrum quibusdam quis sint tempora vel veniam!',
          )}
        </Text>
      </SectionContent>
      <Alert variant="warning">
        {t('This page is still under development')}
      </Alert>
    </Section>
  );
};
