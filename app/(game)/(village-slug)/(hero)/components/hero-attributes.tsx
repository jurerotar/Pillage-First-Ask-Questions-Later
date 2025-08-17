import { Alert } from 'app/components/ui/alert';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/components/text';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';

export const HeroAttributes = () => {
  const { t } = useTranslation();

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Attributes')}</Text>
        <Text>
          {t(
            'Ability points can be used to improve your hero. Hero starts their journey with 4 ability points. Each time a hero gains a level they earn 4 additional ability points that can be used to increase any of the four abilities. Each ability can only be increased a hundred times.',
          )}
        </Text>
      </SectionContent>
      <Alert variant="warning">
        {t('This page is still under development')}
      </Alert>
    </Section>
  );
};
