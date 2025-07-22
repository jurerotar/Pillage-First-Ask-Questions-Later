import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Text } from 'app/components/text';
import { useTranslation } from 'react-i18next';
import { Alert } from 'app/components/ui/alert';

export const NotificationPreferences = () => {
  const { t } = useTranslation();

  // TODO: Add individual notification toggles
  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Notifications')}</Text>
        <Alert variant="warning">This section is still under development</Alert>
      </SectionContent>
    </Section>
  );
};
