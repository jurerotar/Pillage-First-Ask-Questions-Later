import { useTranslation } from 'react-i18next';
import { Alert } from 'app/components/ui/alert';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import { Text } from 'app/components/text';

export const PalaceLoyalty = () => {
  const { t } = useTranslation();

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="loyalty" />
        <Text as="h2">{t('Loyalty')}</Text>
        <Text>
          {t(
            "Every village begins with 100% loyalty. Loyalty determines how firmly a village belongs to your realm. When loyalty drops to 0%, the village will switch allegiance and become part of the attacker's realm.",
          )}
        </Text>
        <Text as="h3">{t('How Loyalty Works')}</Text>
        <Text>
          {t(
            "A village's loyalty cannot decrease as long as it has one of the following buildings:",
          )}
        </Text>
        <ul className="list-disc pl-4">
          <li>{t('Residence')}</li>
          <li>{t('Palace')}</li>
        </ul>
        <Text>
          {t(
            'If none of these buildings are present, loyalty can be reduced by attacks with administrators.',
          )}
        </Text>
        <Text>{t('Once loyalty reaches 0%, the village is conquered.')}</Text>
        <Text as="h3">{t('Increasing Loyalty')}</Text>
        <Text>
          {t(
            'Loyalty automatically increases over time when a Residence or Palace exists in the village.',
          )}
        </Text>
        <ul className="list-disc pl-4">
          <li>
            {t(
              'Each builing level increases loyalty by 2 points every three hours, up to a maximum of 100%.',
            )}
          </li>
          <li>{t('Certain hero items may further increase loyalty.')}</li>
        </ul>
      </SectionContent>
      <SectionContent>
        <Alert variant="warning">
          {t('This page is still under development')}
        </Alert>
      </SectionContent>
    </Section>
  );
};
