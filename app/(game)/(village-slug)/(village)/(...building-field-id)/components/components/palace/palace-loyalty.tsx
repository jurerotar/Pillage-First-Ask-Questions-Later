import { useTranslation } from 'react-i18next';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Text } from 'app/components/text';
import { Alert } from 'app/components/ui/alert';

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
            "A village's loyalty cannot decrease as long as the Residence exists in the village. If Residence does not exist, loyalty can be reduced by attacks with administrators. Once loyalty reaches 0%, the village is conquered.",
          )}
        </Text>
        <Text as="h3">{t('Increasing Loyalty')}</Text>
        <Text>
          {t(
            'Loyalty automatically increases over time when a Residence exists in the village.',
          )}
        </Text>
        <ul className="list-disc pl-4">
          <li>
            <Text>
              {t(
                'Each level of the Residence increases loyalty by 2% every three hours, up to a maximum of 100%.',
              )}
            </Text>
          </li>
          <li>
            <Text>{t('Certain hero items may further increase loyalty.')}</Text>
          </li>
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
