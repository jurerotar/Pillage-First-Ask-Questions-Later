import { useTranslation } from 'react-i18next';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { Text } from 'app/components/text';

export const RearrangeBuildingFields = () => {
  const { t } = useTranslation();
  const { currentVillage: _currentVillage } = useCurrentVillage();

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Rearrange buildings')}</Text>
        <Text>{t('')}</Text>
      </SectionContent>
      <SectionContent />
    </Section>
  );
};
